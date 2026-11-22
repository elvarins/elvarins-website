export const FREE_SHIPPING_CENTS = 14900;
const offer = 'Free standard U.S. shipping on orders of $' + FREE_SHIPPING_CENTS / 100 + '+';

export function shippingOfferCopy(text) {
  return text.replace(/free U\.S\. shipping on orders over \$49/gi, offer)
    .replace('Standard U.S. shipping is free on orders over $49', offer)
    .replace('For orders of $49 or less', 'For orders under $' + FREE_SHIPPING_CENTS / 100);
}

const banner = '<aside class="announcement shipping-promo"><div class="shipping-promo-content"><strong>' + offer +
  '</strong><a href="/shipping-delivery">Shipping details</a><button type="button" data-shipping-promo-open hidden>View offer</button></div></aside>';
const popup = '<dialog class="shipping-promo-dialog" id="shipping-promo-dialog" aria-labelledby="shipping-promo-title">' +
  '<form method="dialog"><button type="submit" class="shipping-promo-dismiss" aria-label="Close offer" autofocus>×</button></form>' +
  '<h2 id="shipping-promo-title">Free shipping on $' + FREE_SHIPPING_CENTS / 100 + '+</h2>' +
  '<p>Get free standard shipping on U.S. orders with a merchandise subtotal of $' + FREE_SHIPPING_CENTS / 100 + ' or more before tax.</p>' +
  '<a class="btn btn-primary" href="/collections/home-kitchen">Shop Home &amp; Kitchen</a> <a href="/shipping-delivery">Shipping details</a></dialog>' +
  '<script src="/shipping-promo.js?v=1" defer></script>';

export function renderShippingPromo(html) {
  return html.replace(/<div class="announcement">[^<]*<a href="\/shipping-delivery">[\s\S]*?<\/a><\/div>/, () => banner)
    .replace('</body>', () => popup + '</body>');
}

export const promoStyles = [
  '.shipping-promo{overflow:hidden;padding:.45rem 1rem;background:#182947;color:#fff}',
  '.shipping-promo-content{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.2rem .8rem;animation:shipping-banner-slide .55s ease-out both}',
  '.shipping-promo a,.shipping-promo button{color:inherit;font:inherit;text-decoration:underline}',
  '.shipping-promo button{border:0;background:none;cursor:pointer;padding:.2rem}',
  '.shipping-promo-dialog{width:min(26rem,calc(100% - 2rem));max-width:100%;margin:auto;border:1px solid #dce4ed;border-radius:1rem;padding:1.6rem;background:#fff;color:#182947}',
  '.shipping-promo-dialog[open]{animation:shipping-popup-slide .28s ease-out both}',
  '.shipping-promo-dialog::backdrop{background:#0f1a30aa}',
  '.shipping-promo-dialog h2{margin:.55rem 2rem .6rem 0;font-size:1.55rem}',
  '.shipping-promo-dismiss{position:absolute;top:.5rem;right:.5rem;border:0;background:transparent;font-size:1.5rem;color:inherit;min-width:44px;min-height:44px;cursor:pointer}',
  '.featured-kitchen-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}',
  '.featured-kitchen-grid .kitchen-preview-card{border:1px solid #dce4ed;border-radius:.8rem;padding:.7rem;background:#fff}',
  '@media(max-width:800px){.featured-kitchen-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}}',
  '@keyframes shipping-banner-slide{from{opacity:0;transform:translateX(-2rem)}to{opacity:1;transform:translateX(0)}}',
  '@keyframes shipping-popup-slide{from{opacity:0;transform:translateY(1.25rem)}to{opacity:1;transform:translateY(0)}}',
  '@media(prefers-reduced-motion:reduce){.shipping-promo-content,.shipping-promo-dialog[open]{animation:none}}'
].join('\n');

export const promoScript = [
  "const promo = document.getElementById('shipping-promo-dialog');",
  "const button = document.querySelector('[data-shipping-promo-open]');",
  "if (promo && button && typeof promo.showModal === 'function') {",
  "  const key = 'elvarins-shipping-offer-149';",
  "  let shown = false;",
  "  try { shown = sessionStorage.getItem(key) === 'shown'; } catch {}",
  "  function openOffer() {",
  "    if (document.querySelector('dialog[open]')) return;",
  "    promo.showModal();",
  "    shown = true;",
  "    try { sessionStorage.setItem(key, 'shown'); } catch {}",
  "  }",
  "  button.hidden = false;",
  "  button.addEventListener('click', openOffer);",
  "  const params = new URLSearchParams(location.search);",
  "  if (!shown && !params.has('q') && !params.has('cart') && !params.has('cancelled') && !location.hash) {",
  "    setTimeout(() => { if (!shown && document.visibilityState === 'visible' && !document.activeElement?.matches('input, textarea, select')) openOffer(); }, 1800);",
  "  }",
  "}"
].join('\n');
