const departments = [
  ['Home &amp; Kitchen', '/collections/home-kitchen', 'Kitchen tools, storage &amp; organization', 'https://gir.co/cdn/shop/files/GIR-BestsellerSet-10_Pieces-Studio.webp?v=1790024511&amp;width=500'],
  ['Pet Supplies', '/collections/pet-supplies', 'Dog chews, toys &amp; pet essentials', '/images/nylabone-ncf315pxxr-front-20261026.jpg'],
  ['Toys &amp; Collectibles', '/#shop', 'Action figures, model kits &amp; collectibles', 'https://cdn.media.amplience.net/i/hasbropulse/G2001_1?w=480&amp;fmt=auto'],
];
const departmentLinks = departments.map(([label, url]) => '<a href="' + url + '">' + label + '</a>').join('');
const storeTitle = 'Elvarins | Home &amp; Kitchen, Pet Supplies, Toys &amp; Collectibles';
const storeDescription = 'Shop kitchen tools and home organization, pet supplies, toys and collectibles at Elvarins, a U.S. online retailer.';

const hero = '<div class="department-hero"><div class="hero-copy"><h1>Home, pets,<br><em>toys &amp; collectibles</em></h1>' +
  '<p>Kitchen tools and organizers, pet essentials, action figures and more.</p></div>' +
  '<nav class="department-hero-grid" aria-label="Shop by department">' +
  departments.map(([label, url, detail, photo]) => '<a class="department-hero-card" href="' + url + '">' +
    '<img src="' + photo + '" alt="" width="220" height="220" decoding="async" referrerpolicy="no-referrer">' +
    '<strong>' + label + '</strong><span>' + detail + '</span></a>').join('') +
  '</nav></div>';

const heroStyles = '<style>' +
  '.department-hero{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.5fr);align-items:center;gap:clamp(1.2rem,4vw,3rem);padding:clamp(.7rem,2.5vw,2rem) 0 1.15rem}' +
  '.department-hero h1{font-size:clamp(2rem,4.6vw,3.9rem);line-height:1.08}' +
  '.department-hero-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(.45rem,1.2vw,.85rem)}' +
  '.department-hero-card{display:flex;flex-direction:column;gap:.35rem;min-width:0;padding:.55rem .55rem .75rem;border:1px solid #d8e2ef;border-radius:14px;background:#fff;color:#192944;text-decoration:none;transition:box-shadow .16s ease,transform .16s ease}' +
  '.department-hero-card:hover,.department-hero-card:focus-visible{transform:translateY(-3px);box-shadow:0 6px 18px #101b3452}' +
  '.department-hero-card:focus-visible{outline:3px solid #f9bc80;outline-offset:3px}' +
  '.department-hero-card img{width:100%;height:auto;aspect-ratio:1;object-fit:contain;background:#f5f7fa;border-radius:9px}' +
  '.department-hero-card strong{font-size:clamp(.8rem,1.25vw,1.03rem);line-height:1.16}' +
  '.department-hero-card span{font-size:.76rem;color:#48576c;line-height:1.3}' +
  '@media(max-width:800px){.department-hero{grid-template-columns:minmax(0,1fr);gap:1rem}.department-hero .hero-copy{max-width:100%}}' +
  '@media(max-width:480px){.department-hero-card{padding:.38rem .38rem .55rem;gap:.35rem}.department-hero-card span{display:none}}' +
  '@media(prefers-reduced-motion:reduce){.department-hero-card{transition:none}.department-hero-card:hover,.department-hero-card:focus-visible{transform:none}}' +
  '</style>';

function balanceDepartments(html) {
  return html
    .replace(/(<nav class="department-nav"[^>]*><div class="wrap"><a href="\/">Home<\/a>)[\s\S]*?(?=<a href="\/brand-partners">)/, '$1' + departmentLinks)
    .replace(/(<div class="navlinks"[^>]*>)([\s\S]*?)(<\/div>)/, (_, open, links, close) => {
      const remaining = links.replace(/<a\b[^>]*>(?:Toys &amp; Collectibles|Pet Supplies|Home &amp; Kitchen)<\/a>/g, '');
      return open + departmentLinks + remaining + close;
    })
    .replace(/(<h3>Shop<\/h3>)[\s\S]*?(?=<\/div>)/, '$1' + departmentLinks)
    .replaceAll('Toys, collectibles and pet supplies for U.S. customers.', 'Home and kitchen essentials, pet supplies, toys and collectibles for U.S. customers.');
}

function balanceHomepage(html) {
  return html
    .replaceAll('Elvarins | Toys, Collectibles &amp; Pet Supplies', storeTitle)
    .replaceAll('Shop toys, character collectibles and pet supplies at Elvarins. Explore clear product details, USD pricing and direct customer support.', storeDescription)
    .replaceAll('Find your next favorite figure. Explore Transformers, Marvel and Funko collectibles with clear prices and direct support.', storeDescription)
    .replaceAll('Elvarins — toys, collectibles and pet supplies', 'Elvarins online store')
    .replace(/<div class="herogrid">[\s\S]*?(?=\s*<div class="benefits">)/, () => hero)
    .replace(/<section class="category-discovery wrap home-only" aria-labelledby="category-heading">[\s\S]*?<\/section>/, '')
    .replace('</head>', () => heroStyles + '</head>');
}

export function supplierStorefront(html,path) {
  if(path!=='/collections/bci')html=html.replace(/href="\/collections\/bci"/g,'href="/collections/bci?photos=1"').replaceAll('Browse all BCI categories','Browse photographed pet &amp; garden products');
  if(path.startsWith('/products/'))html=html.replace('<p>Availability will be confirmed before purchase. </p>','');
  html=balanceDepartments(html);
  if(path==='/')return balanceHomepage(html);
  if(path.startsWith('/collections/')&&path!=='/collections/home-kitchen'){
    html=html.replace(/<section aria-labelledby="sink-home">[\s\S]*?<\/section>/,'');
    if(path==='/collections/pet-supplies')html=html.replace('<h2>Toys &amp; Collectibles</h2>','<h2>Shop Pet Supplies</h2>');
  }
  if(path==='/about')return html
    .replaceAll('A U.S. online retailer for toys, collectibles and pet supplies, operated by Shahabaz Global Trading LLC.', 'A U.S. online retailer for home and kitchen essentials, pet supplies, toys and collectibles, operated by Shahabaz Global Trading LLC.')
    .replace('Our catalog brings together character toys, action figures, model kits, licensed collectibles and selected pet supplies.', 'Our catalog includes kitchen utensils, food storage and home organizers, pet toys and everyday supplies, plus character toys, model kits and collectibles.')
    .replace('Product pages include item numbers, prices in U.S. dollars and photos.','Product pages list prices in U.S. dollars and available item identifiers. Selected listings include product photos.');
  if(path==='/collections/bci')return html.replace('<h1>BCI Catalog</h1>','<h1>Pet, Garden &amp; Farm Catalog</h1><p><a href="/collections/bci?photos=1">With product photos</a> · <a href="/collections/bci">Full catalog</a></p>');
  if(path==='/brand-partners')return html.replace('authorized U.S. distributors in toys, collectibles and pet supplies.', 'authorized U.S. distributors in home and kitchen, pet supplies, toys and collectibles.').replace('<h3>U.S. receiving and preparation</h3><p>We use third-party receiving and preparation services in New York. We share receiving details during trade onboarding. Confirm routing and shipment dates with us before dispatch. For customer returns, contact us for separate instructions.</p>','<h3>Receiving instructions</h3><p>Purchase-order shipping destinations and receiving instructions are confirmed directly with each approved supplier before dispatch. Consumer delivery, returns and customer support are handled through our published retail policies.</p>').replace('<section class="retail-standards">',()=>'<section class="retail-standards"><h2>Wholesale account inquiries</h2><p>Shahabaz Global Trading LLC is seeking wholesale purchasing accounts for retail sales on elvarins.com. Our retail categories include home and kitchen, pet supplies, toys and collectibles.</p><p>Wyoming business registration and resale documentation are available on request. Please email our team for onboarding, channel guidelines and order requirements.</p><p><a href="mailto:sales@elvarins.com?subject=Wholesale%20account%20inquiry">Email wholesale inquiries</a></p></section><section class="retail-standards">');
  return html;
}
