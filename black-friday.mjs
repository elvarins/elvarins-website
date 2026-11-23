const deals = new Map(Object.entries({
  "gir-silicone-spatula-set-red": "page-gir-silicone-spatula-set-red",
  "gir-silicone-spoonula-set-red": "page-gir-silicone-spoonula-set-red",
  "zip-top-bag-set": "page-zip-top-bag-set",
  "zip-top-cup-set": "page-zip-top-cup-set",
  "tovolo-flex-core-deep-spoonula": "page-tovolo-flex-core-deep-spoonula",
  "tovolo-flex-core-jar-scraper": "page-tovolo-flex-core-jar-scraper",
  "u-konserve-bouncebox-nesting-duo": "page-u-konserve-bouncebox-nesting-duo",
  "u-konserve-everyday-rectangle-bundle": "page-u-konserve-everyday-rectangle-bundle",
  "ecolunchbox-three-in-one": "page-ecolunchbox-three-in-one",
  "ecolunchbox-splash-pod": "page-ecolunchbox-splash-pod",
  "bambu-give-it-a-rest-bamboo-utensil-set": "page-bambu-give-it-a-rest-bamboo-utensil-set",
  "bambu-rice-paddle-new-design": "page-bambu-rice-paddle-new-design",
  "madesmart-expandable-silverware-tray-2": "page-madesmart-expandable-silverware-tray-2",
  "madesmart-classic-large-silverware-tray": "page-madesmart-classic-large-silverware-tray",
  "dreamfarm-garject": "page-dreamfarm-garject",
  "nylabone-power-chew-textured-ring-flavor-medley-xl-bci-491174": "BCI-491174",
  "transformers-age-of-the-primes-voyager-nexus-prime-hsg2001": "HSG2001",
  "transformers-generations-legacy-evolution-deluxe-beachcomber-hsf7196": "HSF7196",
  "transformers-cyberworld-scorponok-strike-battle-figure-hsg1659": "HSG1659",
  "transformers-wfc-siege-greenlight-with-dazzlestrike-hse4486": "HSE4486",
  "spider-man-brand-new-day-2-in-1-super-chompin-tank-hsg3439": "HSG3439",
  "marvel-legends-professor-x-6-inch-action-figure-hse4703": "HSE4703",
  "x-men-marvel-legends-archangel-x-force-6-inch-action-figure-hsg0585": "HSG0585",
  "spider-man-brand-new-day-role-play-costume-mask-hsg3442": "HSG3442",
  "visionquest-the-vision-funko-pop-vinyl-figure-1650-fu93834": "FU93834",
  "visionquest-ultron-funko-pop-vinyl-figure-1650-fu93836": "FU93836",
  "avengers-doomsday-yelena-bitty-pop-mini-figure-4-pack-fu92947": "FU92947",
  "avengers-doomsday-shuri-funko-bitty-pop-mini-figure-4-pack-fu92949": "FU92949",
  "spidey-and-his-amazing-friends-dino-webs-spidey-and-goblin-hsg0120": "HSG0120",
  "spidey-supersized-ghost-spider-9-inch-action-figure-hsf3987": "HSF3987",
  "magic-8-ball-classic-mattel-fortune-telling-toy-mt30188": "MT30188",
  "huntr-x-kpop-demon-hunters-little-people-collector-set-fpjrm87": "FPJRM87"
}));
const dealSkus = new Set(deals.values());
export const discountCents = cents => Math.round(cents*80/100);
export function withDealPricing(product) {
  if (!product || product.inStock===false || !dealSkus.has(product.sku) || !(product.price>0)) return product;
  return {...product, dealPrice:discountCents(Math.round(product.price*100))/100};
}
export function dealUnitCents(sku, cents) {
  return dealSkus.has(sku) ? discountCents(cents) : cents;
}

const isPrice = /<(p class="kitchen-retail-price"[^>]*|strong class="price"[^>]*|span class="price"[^>]*)>(\s*<strong[^>]*>)?\s*\$?(\d+\.\d{2})(?:\s*USD)?\s*(?:<\/strong>)?<\/(p|strong|span)>/;
export function dealProductPage(html, path) {
  html = html.replace(/<span class="elv-featured-pick">[\s\S]*?<\/span>/g, '');
  const sku = deals.get(path.startsWith('/products/') ? path.slice(10) : '');
  if (!sku) return html;
  let dealPrice;
  const page = html.replace(/<aside class="retail-buy-box"[^>]*>[\s\S]*?<\/aside>/,
    box => {
      if (!/<button[^>]*(?:data-elv-cart-add|data-kitchen-action=)/.test(box) || box.includes('data-stock-state="out"')) return box;
      return box.replace(isPrice, (_, _open, _strong, amount) => {
        dealPrice = (discountCents(Math.round(Number(amount)*100))/100).toFixed(2);
        return '<div class="elv-deal"><span class="elv-deal-badge">Black Friday Deal</span>'+
          '<div class="elv-deal-price"><span>−20%</span> <strong>$'+dealPrice+'</strong></div>'+
          '<p>List price: <s>$'+amount+'</s></p></div>';
      });
    });
  if (!dealPrice) return html;
  return page.replace(/(<span class="price">)\$[\d.]+(?=\s*<small>)/, (_, open)=>open+'$'+dealPrice)
    .replace(/(<div class="elv-mobile-buy"[^>]*><strong>)\$[\d.]+(<\/strong>)/, (_, start, end)=>start+'$'+dealPrice+end);
}

export function dealCartSource(source) {
  const compute = 'const dealSkus = new Set('+JSON.stringify([...dealSkus])+');\n'+
    'const checkoutUnitCents = p => {const unit=Math.round(Number(p.price)*100);return dealSkus.has(p.sku)?Math.round(unit*80/100):unit};\n';
  return source.replace('const KEY=',()=>compute+'const KEY=')
    .replace('Math.round(Number(p.price)*100)*quantity','checkoutUnitCents(p)*quantity')
    .replace("fmt(p.price)+' each'","fmt(checkoutUnitCents(p)/100)+' each'");
}

export const dealCss = [
  '.elv-deal{margin:.5rem 0 .75rem}',
  '.elv-deal-badge{display:inline-flex;width:max-content;max-width:100%;padding:.34rem .65rem;border-radius:999px;background:#8a1932;color:#fff;font-size:.77rem;font-weight:800;animation:elv-deal-in .32s ease-out both}',
  '.elv-deal-price{display:flex;align-items:baseline;flex-wrap:wrap;gap:.35rem .55rem;margin:.36rem 0 .18rem}',
  '.elv-deal-price span{color:#a11635;font-weight:700;font-size:1.18rem}',
  '.elv-deal-price strong{color:#142742;font-size:clamp(1.65rem,3.5vw,2.1rem);line-height:1.15}',
  '.elv-deal p{margin:0;color:#526174;font-size:.84rem}',
  '@keyframes elv-deal-in{from{opacity:.25;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}',
  '@media(prefers-reduced-motion:reduce){.elv-deal-badge{animation:none}}'
].join('\n');
