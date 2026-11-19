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

function canReadOrders(request, key) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ') || auth.length > 512) return false;
  try {
    const supplied = new TextEncoder().encode(atob(auth.slice(6)));
    const expected = new TextEncoder().encode('prep:' + key);
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
  if (!env.CUSTOMER_DB || !/^[a-f0-9]{64}$/.test(key || '')) {
    return response(request.method === 'HEAD' ? null : 'Fulfillment portal is awaiting setup.', 503);
  }
  if (!canReadOrders(request, key)) {
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
  return response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elvarins Fulfillment</title><style>body{font:1rem system-ui,sans-serif;margin:0;background:#f2f5f9;color:#17243a}main{max-width:56rem;margin:auto;padding:1.5rem}article{padding:1rem 1.25rem;margin:1rem 0;border:1px solid #ced8e6;background:white;border-radius:.6rem;overflow-wrap:anywhere}article div{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr));gap:1rem}address{font-style:normal}</style><main><h1>Elvarins Fulfillment</h1><p>Paid U.S. orders. Confirm the order is still paid and has not been refunded in Stripe before shipping. Use the order reference to prevent duplicate shipments.</p>' +
    (cards.length ? cards.map(orderCard).join('') : '<p>No paid orders on this page.</p>') +
    (results.length > 50 ? '<p><a href="?before=' + escape(cards.at(-1).paid_at + ':' + cards.at(-1).id) + '">Older orders</a></p>' : '') +
    '</main></html>');
}
