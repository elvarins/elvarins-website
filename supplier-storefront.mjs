const kitchenStart = '<section class="section home-only" aria-labelledby="home-kitchen-home">';
const petStart = '<section class="section home-only" aria-labelledby="pet-supplies-home">';
const departments = '<section class="section" id="collections">';

export function supplierStorefront(html,path) {
  if(path!=='/collections/bci')html=html.replace(/href="\/collections\/bci"/g,'href="/collections/bci?photos=1"').replaceAll('Browse all BCI categories','Browse photographed pet &amp; garden products');
  if(path.startsWith('/products/'))html=html.replace('<p>Availability will be confirmed before purchase. </p>','');
  if(path==='/'){
    const start=html.indexOf(kitchenStart), end=html.indexOf(petStart), target=html.indexOf(departments);
    if(start>=0&&end>start&&target>end)html=html.slice(0,start)+html.slice(end,target)+html.slice(start,end)+html.slice(target);
    return html.replace('Home, pets','Toys, pets').replace('Browse kitchen tools, pet essentials, action figures and collectibles.','Shop action figures, collectibles and pet essentials.').replace('Shop Best Sellers','Shop Featured Products');
  }
  if(path.startsWith('/collections/')&&path!=='/collections/home-kitchen'){
    html=html.replace(/<section aria-labelledby="sink-home">[\s\S]*?<\/section>/,'');
    if(path==='/collections/pet-supplies')html=html.replace('<h2>Toys &amp; Collectibles</h2>','<h2>Shop Pet Supplies</h2>');
  }
  if(path==='/about')return html.replace('Product pages include item numbers, prices in U.S. dollars and photos.','Product pages list prices in U.S. dollars and available item identifiers. Selected listings include product photos.');
  if(path==='/collections/bci')return html.replace('<h1>BCI Catalog</h1>','<h1>Pet, Garden &amp; Farm Catalog</h1><p><a href="/collections/bci?photos=1">With product photos</a> · <a href="/collections/bci">Full catalog</a></p>');
  if(path==='/brand-partners')return html.replace('<section class="retail-standards">',()=>'<section class="retail-standards"><h2>Wholesale account inquiries</h2><p>Shahabaz Global Trading LLC is seeking wholesale purchasing accounts for retail sales on elvarins.com. Our core categories are toys, collectibles and pet supplies for U.S. customers.</p><p>Wyoming business registration and resale documentation are available on request. Please email our team for onboarding, channel guidelines and order requirements.</p><p><a href="mailto:sales@elvarins.com?subject=Wholesale%20account%20inquiry">Email wholesale inquiries</a></p></section><section class="retail-standards">');
  return html;
}
