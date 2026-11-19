// Work from the existing rendered facts so imported, curated and owner-edited
// products share a layout without maintaining a second catalog.
const displayFields = new Map([
  ['brand','Brand'], ['item size','Size'], ['size','Size'],
  ['size / variant','Size or variant'], ['manufacturer recommended age','Recommended age'],
  ['recommended age','Recommended age'], ['package contents','In the package'],
  ['product type','Product type'], ['selling unit','Selling unit'],
  ['manufacturer item number','Manufacturer item number'], ['item number','Item number'],
  ['supplier item number','Supplier item number'],
  ['upc','UPC'], ['upc / gtin','UPC or GTIN'], ['sku','SKU'],
]);

export function presentProduct(html) {
  return html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i, main => {
    const heading = main.match(/<h1\b[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim();
    const specs = main.match(/<dl\b[^>]*>[\s\S]*?<\/dl>/i)?.[0];
    if (!heading || !specs) return main;
    const facts = [...specs.matchAll(/<dt\b[^>]*>([^<]+)<\/dt>\s*<dd\b[^>]*>([^<]+)<\/dd>/gi)]
      .map(([, label, value]) => [displayFields.get(label.trim().toLowerCase()), value.trim()])
      .filter(([label,value]) => label && value && !/^(?:n\/?a|unknown|undefined|null|-)$/i.test(value));
    const brand = facts.find(([label]) => label === 'Brand')?.[1];
    if (brand && !heading.toLowerCase().includes(brand.toLowerCase())) {
      main = main.replace(/(<h1\b[^>]*>)[^<]+(<\/h1>)/i, (_,open,close) => open+brand+' '+heading+close);
    }
    const summary = main.match(/<p class="description">([^<]+)<\/p>/i)?.[1]?.trim();
    // Service and imported templates already render their catalog description
    // beneath the page title. Only supply a factual fallback if it is absent.
    const serviceSummary = main.match(/<h1\b[^>]*>[^<]+<\/h1>\s*<p\b[^>]*>([^<]+)<\/p>/i)?.[1]?.trim();
    const description = summary || serviceSummary ? '' : '<p class="description">'+heading+' '+(facts.some(([label])=>label==='Size or variant')?'See the size or variant and item details below.':'See the item details below.')+'</p>';
    const highlights = facts.filter(([label]) => !['SKU','UPC','UPC or GTIN','Item number','Manufacturer item number','Supplier item number'].includes(label));
    const count = heading.match(/\b(\d+)[ -](?:pieces|piece|pack|count)\b/i);
    if (count && !highlights.some(([label])=>label==='In the package')) highlights.unshift(['Package quantity',count[1]+' items']);
    const bullets = (highlights.length ? highlights : facts).slice(0,5)
      .map(([label,value]) => '<li><strong>'+label+'</strong> '+value+'</li>').join('');
    return main.replace(specs, () => description+(bullets ? '<section class="elv-product-highlights" aria-label="Product highlights"><h2>Product highlights</h2><ul>'+bullets+'</ul></section>' : '')+
      '<details class="elv-product-specs"><summary>Specifications</summary>'+specs+'</details>');
  });
}

export const productPresentationCss = `
.elv-product-highlights{padding:.75rem 0;margin:.4rem 0;border-top:1px solid #e2e8f2}
.elv-product-highlights h2{font-size:1rem;margin:0 0 .45rem}
.elv-product-highlights ul{margin:0;padding-inline-start:1.15rem;display:grid;gap:.3rem}
.elv-product-highlights li{line-height:1.35;overflow-wrap:anywhere}
.elv-product-highlights strong{margin-inline-end:.2rem}
.elv-product-specs{border-top:1px solid #e2e8f2;margin:.25rem 0;padding:.6rem 0}
.elv-product-specs summary{cursor:pointer;min-height:36px;padding:.35rem 0;font-weight:700;color:#183767}
.elv-product-specs dl{margin:.45rem 0 0}
.product-page .retail-buy-box,.service-page .retail-buy-box{align-self:start}
@media(max-width:720px){
  main .retail-pdp-grid .retail-buy-box,main .retail-kitchen-grid .retail-buy-box,main .retail-bci-layout .retail-buy-box{order:1;align-self:stretch}
  main .retail-pdp-grid .detail-copy,main .retail-bci-layout .company-story-copy,main .retail-kitchen-grid>div{order:2}
  .elv-product-highlights{font-size:.91rem}
}
`;
