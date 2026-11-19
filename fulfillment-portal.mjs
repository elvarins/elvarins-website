import { timingSafeEqual } from 'node:crypto';

const headers = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; style-src 'unsafe-inline'",
};
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const response = (body, status = 200, extra = {}) => new Response(body, {status, headers: {...headers, ...extra}});

function authorized(request, username, key) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ') || auth.length > 512) return false;
  try {
    const supplied = new TextEncoder().encode(atob(auth.slice(6)));
    const expected = new TextEncoder().encode(username + ':' + key);
    return supplied.byteLength === expected.byteLength && timingSafeEqual(supplied, expected);
  } catch {
    return false;
  }
}

function orderCard(order) {
  const items = JSON.parse(order.cart_json);
  const address = JSON.parse(order.shipping_address_json);
  const lines = [order.shipping_name, address.line1, address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(' '), address.country];
  return '<article><h2>Order ' + escape(order.id) + '</h2><p>Paid ' +
    escape(new Date(order.paid_at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC') +
    '</p><div><section><h3>Pack</h3><ul>' + items.map(item =>
      '<li>' + escape(item.sku) + ' × ' + escape(item.quantity) + '</li>').join('') +
    '</ul></section><section><h3>Ship to</h3><address>' + lines.filter(Boolean).map(escape).join('<br>') +
    '</address></section></div></article>';
}

export async function fulfillmentPortal(request, env) {
  if (!['GET', 'HEAD'].includes(request.method)) return response(null, 405, {Allow:'GET, HEAD'});
  const key = env.FULFILLMENT_PORTAL_KEY;
  const prepReady = /^[a-f0-9]{64}$/.test(key || '') && key !== env.OWNER_DASHBOARD_KEY;
  const ownerReady = /^[a-f0-9]{64}$/.test(env.OWNER_DASHBOARD_KEY || '') && key !== env.OWNER_DASHBOARD_KEY;
  if (!env.CUSTOMER_DB || (!prepReady && !ownerReady)) {
    return response(request.method === 'HEAD' ? null : 'Fulfillment portal is awaiting setup.', 503);
  }
  if (!(prepReady && authorized(request, 'prep', key)) && !(ownerReady && authorized(request, 'owner', env.OWNER_DASHBOARD_KEY))) {
    return response(null, 401, {'WWW-Authenticate':'Basic realm="Elvarins Fulfillment", charset="UTF-8"'});
  }
  if (request.method === 'HEAD') return response(null);
  const before = new URL(request.url).searchParams.get('before');
  const cursor = before?.match(/^(\d{13}):([a-f0-9-]{36})$/);
  if (before && !cursor) return response('Invalid page cursor.', 400);
  const cutoff = cursor ? Number(cursor[1]) : Date.now() + 1;
  const {results} = await env.CUSTOMER_DB.prepare(
    "SELECT id, cart_json, shipping_name, shipping_address_json, paid_at FROM checkout_orders WHERE status = 'paid' AND stripe_session_id GLOB 'cs_live_*' AND (paid_at < ? OR (paid_at = ? AND id < ?)) AND shipping_address_json IS NOT NULL ORDER BY paid_at DESC, id DESC LIMIT 51"
  ).bind(cutoff, cutoff, cursor?.[2] || '').all();
  const cards = results.slice(0, 50);
  return response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elvarins Fulfillment</title><style>body{font:1rem system-ui,sans-serif;margin:0;background:#f2f5f9;color:#17243a}main{max-width:56rem;margin:auto;padding:1.5rem}article{padding:1rem 1.25rem;margin:1rem 0;border:1px solid #ced8e6;background:white;border-radius:.6rem;overflow-wrap:anywhere}article div{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr));gap:1rem}address{font-style:normal}</style><main><h1>Elvarins Fulfillment</h1><p>Paid U.S. orders. Confirm the order has not been refunded before shipping. Use the order reference to prevent duplicate shipments.</p>' +
    (cards.length ? cards.map(orderCard).join('') : '<p>No paid orders on this page.</p>') +
    (results.length > 50 ? '<p><a href="?before=' + escape(cards.at(-1).paid_at + ':' + cards.at(-1).id) + '">Older orders</a></p>' : '') +
    '</main></html>');
}

function catalogRow(product) {
  const missing = [
    ['size', !product.size], ['age guidance', !product.age],
    ['manufacturer item number', !product.manufacturerSku], ['UPC/GTIN', !product.gtin12 && !product.gtin13],
  ].filter(([, needsReview]) => needsReview).map(([field]) => field);
  return '<tr><th scope="row"><a href="' + escape(product.url) + '">' + escape(product.title) +
    '</a></th><td>' + escape(product.sku) + '</td><td>$' + escape(product.price.toFixed(2)) +
    '</td><td>' + escape(missing.join(', ') || 'Recorded') + '</td></tr>';
}

export async function ownerDashboard(request, env, products) {
  if (!['GET', 'HEAD', 'POST'].includes(request.method)) return response(null, 405, {Allow:'GET, HEAD, POST'});
  const key = env.OWNER_DASHBOARD_KEY;
  if (!env.CUSTOMER_DB || !/^[a-f0-9]{64}$/.test(key || '') || key === env.FULFILLMENT_PORTAL_KEY) {
    return response(request.method === 'HEAD' ? null : 'Owner dashboard is awaiting setup.', 503);
  }
  if (!authorized(request, 'owner', key)) {
    return response(null, 401, {'WWW-Authenticate':'Basic realm="Elvarins Owner Dashboard", charset="UTF-8"'});
  }
  if (request.method === 'HEAD') return response(null);
  if (request.method === 'POST') {
    const origin = new URL(request.url).origin;
    if (request.headers.get('Origin') !== origin || !request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) return response('Invalid form origin or format.', 403);
    const reader = request.body?.getReader();
    if (!reader) return response('Missing form.', 400);
    let body = '';
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const {value, done} = await reader.read();
        if (done) break;
        body += decoder.decode(value, {stream:true});
        if (body.length > 1024) {
          await reader.cancel();
          return response('Form too large.', 413);
        }
      }
    } finally {
      reader.releaseLock();
    }
    const form = new URLSearchParams(body);
    const id = form.get('inquiryId');
    const state = form.get('state');
    if (!/^[a-f0-9-]{36}$/.test(id || '') || !['open', 'resolved'].includes(state)) return response('Invalid support update.', 400);
    await env.CUSTOMER_DB.prepare('INSERT INTO support_workflow(inquiry_id, state, updated_at) SELECT id, ?, ? FROM inquiries WHERE id = ? ON CONFLICT(inquiry_id) DO UPDATE SET state=excluded.state, updated_at=excluded.updated_at').bind(state, Date.now(), id).run();
    return response(null, 303, {Location:'/api/account/admin#support'});
  }
  const [orders, support] = await env.CUSTOMER_DB.batch([
    env.CUSTOMER_DB.prepare("SELECT status, COUNT(*) AS count FROM checkout_orders WHERE stripe_session_id GLOB 'cs_live_*' GROUP BY status"),
    env.CUSTOMER_DB.prepare('SELECT i.id, i.email, i.topic, i.message, n.status AS delivery, w.state FROM inquiries i LEFT JOIN inquiry_notifications n ON n.inquiry_id = i.id LEFT JOIN support_workflow w ON w.inquiry_id = i.id ORDER BY i.created_at DESC LIMIT 20'),
  ]);
  return response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elvarins Owner Dashboard</title><style>body{font:1rem system-ui,sans-serif;background:#f2f5f9;color:#17243a}main{max-width:72rem;margin:auto;padding:1rem}section{background:white;border:1px solid #ced8e6;border-radius:.6rem;padding:1rem;margin:1rem 0;overflow-wrap:anywhere}.table{overflow:auto}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.6rem;border-bottom:1px solid #ced8e6}nav a{margin-right:1rem}p.message{white-space:pre-wrap}</style><main><h1>Elvarins Owner Dashboard</h1><nav aria-label="Dashboard"><a href="#orders">Orders</a><a href="#catalog">Catalog</a><a href="#support">Support</a><a href="/api/account/fulfillment">Prep center</a><a href="/">Storefront</a></nav>' +
    '<section id="orders"><h2>Live checkout</h2><p>Counts from the storefront order ledger.</p><ul>' +
    (orders.results.map(order => '<li>' + escape(order.status) + ': ' + escape(order.count) + '</li>').join('') || '<li>No live checkout sessions yet.</li>') +
    '</ul><p><a href="/api/account/fulfillment">Open paid orders for packing</a></p></section>' +
    '<section id="catalog"><h2>Main catalog</h2><p>' + escape(products.length) + ' products. Fields under review may be missing or may need manufacturer confirmation.</p><div class="table"><table><thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Fields to review</th></tr></thead><tbody>' +
    products.map(catalogRow).join('') + '</tbody></table></div></section>' +
    '<section id="support"><h2>Latest support inquiries</h2>' + (support.results.map(item =>
      '<details><summary>' + escape(item.topic) + ' · ' + escape(item.id) + '</summary><p>Email: ' + escape(item.email) +
      '</p><p>Notification: ' + escape(item.delivery || 'not recorded') + ' · Support: ' + escape(item.state || 'open') + '</p><p class="message">' + escape(item.message) +
      '</p><form method="post"><input type="hidden" name="inquiryId" value="' + escape(item.id) + '"><button name="state" value="' +
      (item.state === 'resolved' ? 'open">Reopen' : 'resolved">Mark resolved') + '</button></form></details>').join('') || '<p>No inquiries yet.</p>') +
    '</section></main></html>', 200, {'Content-Security-Policy': headers['Content-Security-Policy'].replace("form-action 'none'", "form-action 'self'")});
}
