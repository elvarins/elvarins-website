import products from './template-pilot-products.json' with { type: 'json' };
import { customerUI } from './customer-ui.mjs';
import { FREE_SHIPPING_CENTS } from './shipping-offer.mjs';
import { pilotStyles, pilotClient } from './template-pilot-assets.mjs';

const root = '/template-preview';
const purchaseMode = 'cart'; // 'request' uses the same templates and inquiry form.
const groups = new Map([['toys','Toys & Collectibles'],['pets','Pet Supplies'],['home','Home & Kitchen']]);
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const esc = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const to = product => root + '/products/' + encodeURIComponent(product.slug);
const canonical = product => 'https://elvarins.com/products/' + encodeURIComponent(product.slug);
const available = value => value!==null && value!==undefined && value!=='';
const money = amount => currency.format(amount);
const shipping = 'Free standard U.S. shipping on orders of $'+FREE_SHIPPING_CENTS/100+'+';
const cartEnabled = purchaseMode==='cart';

function catalogUrl(params={}) {
  const query = new URLSearchParams(Object.entries(params).filter(([,value])=>available(value)));
  return root+'/catalog'+(query.size?'?'+query:'');
}

function icon(name) {
  const paths = {
    truck:'<path d="M2 5h12v12H2zM14 9h4l4 4v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    returns:'<path d="M4 10h11a5 5 0 1 1 0 10h-3M9 5l-5 5 5 5"/>',
    lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/>',
    eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2"/>'
  };
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>';
}

function layout({title,description,body,product,commerce=true}) {
  const schema = product ? {
    '@context':'https://schema.org','@type':'Product',name:product.title,description:product.meta_description||product.description,
    brand:product.brand?{'@type':'Brand',name:product.brand}:undefined,sku:product.id,gtin12:product.upc||undefined,
    mpn:product.mpn||undefined,image:product.images,
    offers:{'@type':'Offer',price:product.price.toFixed(2),priceCurrency:'USD',availability:'https://schema.org/'+(product.in_stock?'InStock':'OutOfStock'),url:canonical(product)}
  } : null;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="robots" content="noindex,nofollow"><title>'+esc(title)+' | Elvarins</title><meta name="description" content="'+esc(description)+'">'+
    (product?'<link rel="canonical" href="'+esc(canonical(product))+'"><script type="application/ld+json">'+JSON.stringify(schema).replaceAll('<','\\u003c')+'</script>':'')+
    '<link rel="stylesheet" href="/style.css">'+(commerce&&cartEnabled?'<link rel="stylesheet" href="/cart.css">':'')+
    '<link rel="stylesheet" href="'+root+'/layout.css?v=2"></head><body class="pilot"><a class="pilot-skip" href="#pilot-main">Skip to content</a>'+
    '<header class="pilot-header"><nav class="pilot-shell pilot-nav" aria-label="Store navigation"><a class="pilot-wordmark" href="/"><img src="/logo.svg" alt="" width="32" height="32">Elvarins</a>'+
    '<a href="'+root+'/catalog">Catalog preview</a><a href="/contact">Contact</a>'+
    (commerce&&cartEnabled?'<button class="pilot-link" type="button" data-open-account="login">Sign in</button>':'')+'</nav></header>'+
    '<main class="pilot-shell" id="pilot-main">'+body+'</main><footer class="pilot-footer"><div class="pilot-shell"><a href="/contact">Contact form</a><a href="mailto:sales@elvarins.com">sales@elvarins.com</a></div></footer>'+
    (commerce&&cartEnabled?customerUI+
      '<script src="/retail.js?v=account-6" defer></script><script src="/cart.js?v=design-refresh-13" defer></script>':'')+
    '<script src="'+root+'/layout.js?v=2" defer></script></body></html>';
}

const bread = (links, title) => '<nav class="pilot-breadcrumb" aria-label="Breadcrumb"><ol>'+[['Home','/'],...links].map(([label,url])=>
  '<li><a href="'+esc(url)+'">'+esc(label)+'</a></li>').join('')+'<li aria-current="page">'+esc(title)+'</li></ol></nav>';

const image = (src,title,lazy=true) => '<img src="'+esc(src)+'" alt="'+esc(title)+'" width="640" height="640" '+(lazy?'loading="lazy"':'fetchpriority="high"')+' decoding="async" referrerpolicy="no-referrer">';
const stock = product => '<p class="pilot-stock" data-in-stock="'+product.in_stock+'">'+(product.in_stock?'In Stock':'Out of Stock')+'</p>';

function action(product, primary=true) {
  if (!product.in_stock) return '<button class="pilot-button" disabled>Out of Stock</button>';
  if (!cartEnabled) return '<a class="pilot-button" href="'+to(product)+'#questions" data-item-request>Request this item</a>';
  return '<button type="button" class="pilot-button'+(primary?'':' pilot-outline')+'" data-elv-cart-add="'+esc(product.id)+'"'+(primary?'':' data-elv-buy-now')+'>'+ (primary?'Add to Cart':'Buy Now')+'</button>';
}

function card(p) {
  return '<article class="pilot-card"><a class="pilot-card-media" href="'+to(p)+'">'+image(p.images[0],p.title)+
    (p.images[1]?'<span class="pilot-alternate" aria-hidden="true">'+image(p.images[1],'')+'</span>':'')+'</a>'+
    (p.brand?'<p class="pilot-brand">'+esc(p.brand)+'</p>':'')+
    '<h2><a href="'+to(p)+'">'+esc(p.title)+'</a></h2><p class="pilot-card-price">'+money(p.price)+'</p>'+stock(p)+
    '<div class="pilot-card-actions">'+action(p)+'<button type="button" class="pilot-quick" aria-label="Quick view: '+esc(p.title)+'" data-quick="'+esc(p.id)+'">'+icon('eye')+'</button></div></article>';
}

function specGroups(p) {
  const s=p.specs||{};
  return [
    ['General', [['Brand',p.brand],['Line / series',s.line],['Character / franchise',s.character],['Product type',s.type],['Model / MPN',p.mpn],['UPC',p.upc]]],
    ['Size & weight', [['Product dimensions',p.dimensions],['Height',s.height],['Scale',s.scale],['Package dimensions',s.package_dimensions],['Product weight',p.weight],['Package weight',s.package_weight]]],
    ['Details', [['Age grade',p.age_grade],['Material',s.material],['Batteries',s.batteries],['Piece count',s.piece_count],['Country of origin',s.country_of_origin],['Release year',s.release_year],['Conversion steps',s.conversion_steps]]]
  ].map(([label,rows])=>[label,rows.filter(([,v])=>available(v))]).filter(([,rows])=>rows.length);
}
const list = items => '<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';

function productPage(p, paymentLive) {
  const details = [];
  const add = (id, title, body) => { if(body)details.push({id,title,body}); };
  add('about-item','About this item',p.bullets?.length?list(p.bullets):'');
  add('description','Description',p.description?'<p>'+esc(p.description)+'</p>':'');
  add('includes','What’s in the box',p.includes?.length?list(p.includes):'');
  const specificationGroups=specGroups(p);
  add('specifications','Specifications',specificationGroups.map(([label,rows])=>'<table class="pilot-spec-table"><caption>'+esc(label)+'</caption><tbody>'+
    rows.map(([key,value])=>'<tr><th scope="row">'+esc(key)+'</th><td>'+esc(value)+'</td></tr>').join('')+'</tbody></table>').join(''));
  add('safety','Safety & compliance','<p>Check the product packaging for age grading and safety warnings before purchase.</p>'+
    (p.warnings?.length?list(p.warnings):''));
  if(p.size_guide?.length) {
    add('size-guide','Size guide','<button class="pilot-outline pilot-button" type="button" data-open-dialog="pilot-size">Open size guide</button>'+
      '<dialog id="pilot-size" aria-labelledby="pilot-size-title" class="pilot-dialog"><form method="dialog"><button class="pilot-close" aria-label="Close size guide">×</button></form>'+
      '<h2 id="pilot-size-title">Size guide</h2><table class="pilot-spec-table"><thead><tr><th scope="col">Size</th><th scope="col">Weight range</th></tr></thead><tbody>'+
      p.size_guide.map(row=>'<tr><th scope="row">'+esc(row.size)+'</th><td>'+esc(row.weight_range)+'</td></tr>').join('')+'</tbody></table></dialog>');
  }
  add('shipping','Shipping & returns','<p>'+shipping+'. <a href="/shipping-delivery">Shipping policy</a></p><p>30-day return window for eligible items. <a href="/returns">Returns policy</a></p>');
  add('questions','Questions & answers','<a class="pilot-button pilot-outline" href="/contact" data-open-dialog="pilot-inquiry">Ask a question</a>'+
    '<dialog class="pilot-dialog" id="pilot-inquiry" aria-labelledby="pilot-inquiry-title"><form method="dialog"><button class="pilot-close" aria-label="Close question form">×</button></form>'+
    '<h2 id="pilot-inquiry-title">Ask a question</h2><p>'+esc(p.title)+'</p><form class="pilot-inquiry" data-inquiry data-sku="'+esc(p.id)+'" action="/contact">'+
    '<label>Name<input name="name" autocomplete="name" minlength="2" maxlength="100" required></label>'+
    '<label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label>'+
    '<label>Your question<textarea name="message" minlength="10" maxlength="3000" rows="4" required></textarea></label>'+
    '<button class="pilot-button" type="submit">Send question</button><p role="status"></p></form>'+
    '<p><a href="mailto:sales@elvarins.com">sales@elvarins.com</a> · <a href="/contact">Contact form</a></p></dialog>');
  const related=products.filter(x=>x.id!==p.id && p.related_ids?.includes(x.id)).slice(0,4);
  const sameBrand=products.filter(x=>x.id!==p.id && p.brand && x.brand===p.brand).slice(0,4);
  for(const [id,title,items] of [['collection','Complete your collection',related],['brand','More from '+p.brand,sameBrand]]) {
    add(id,title,items.length?'<div class="pilot-grid">'+items.map(card).join('')+'</div>':'');
  }
  const chips=[p.age_grade,p.specs?.scale||p.specs?.height,p.specs?.piece_count?p.specs.piece_count+' pieces':'',p.brand].filter(available);
  const gallery=p.images.slice(0,8);
  const slides=gallery.map((src,i)=>'<div class="pilot-slide"><a class="pilot-zoom-link" href="'+esc(src)+'" aria-label="Zoom photo '+(i+1)+'">'+image(src,p.title,i!==0)+'</a></div>').join('');
  const controls = kind => gallery.map((src,i)=>'<button type="button" data-slide="'+i+'" aria-label="Photo '+(i+1)+'" aria-current="'+(i===0)+'">'+
    (kind==='thumb'?image(src,''):'<span aria-hidden="true"></span>')+'</button>').join('');
  return layout({title:p.title,description:p.meta_description||p.description,product:p,body:
    bread([[groups.get(p.department),catalogUrl({department:p.department})],[p.category,catalogUrl({department:p.department,category:p.category})]],p.title)+
    '<div class="pilot-product"><section class="pilot-gallery" aria-label="Product images" data-gallery>'+
    (gallery.length>1?'<div class="pilot-thumbs" role="group" aria-label="Choose a product photo">'+controls('thumb')+'</div>':'')+
    '<div class="pilot-track" tabindex="0" aria-label="Product photos">'+slides+'</div>'+
    (gallery.length>1?'<div class="pilot-dots" role="group" aria-label="Choose a product photo">'+controls('dot')+'</div>':'')+
    '</section><section class="pilot-buy" aria-label="Purchase options">'+
    (p.brand?'<a class="pilot-brand-link" href="'+esc(catalogUrl({brand:p.brand}))+'">More from '+esc(p.brand)+'</a>':'')+
    '<h1>'+esc(p.title)+'</h1><p class="pilot-price">'+money(p.price)+'</p><p class="pilot-shipping">'+esc(cartEnabled?shipping:'Shipping confirmed with your request')+'</p>'+stock(p)+
    (chips.length?'<ul class="pilot-facts">'+chips.slice(0,4).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+
    '<label class="pilot-qty">Quantity<select id="buy-quantity">'+Array.from({length:10},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join('')+'</select></label>'+
    '<div class="pilot-primary">'+action(p)+(cartEnabled&&p.in_stock?action(p,false):'')+'</div>'+
    '<ul class="pilot-trust"><li>'+icon('truck')+'<a href="/shipping-delivery">Processing in 1–2 business days</a></li>'+
    '<li>'+icon('returns')+'<a href="/returns">30-day returns on eligible items</a></li>'+
    (paymentLive&&cartEnabled?'<li>'+icon('lock')+'<span>Secure payment</span></li>':'')+'</ul>'+
    '<p class="pilot-seller">Sold by Elvarins (Shahabaz Global Trading LLC)</p></section></div>'+
    '<nav class="pilot-sections" aria-label="Product details">'+details.map(x=>'<a href="#'+x.id+'">'+esc(x.title)+'</a>').join('')+'</nav>'+
    '<div class="pilot-details">'+details.map(x=>'<details id="'+x.id+'" open><summary><h2>'+esc(x.title)+'</h2></summary><div class="pilot-detail-body">'+x.body+'</div></details>').join('')+'</div>'+
    (p.in_stock?'<div class="pilot-sticky" data-sticky-buy hidden><strong>'+money(p.price)+'</strong>'+action(p)+'</div>':'')+
    '<dialog class="pilot-dialog pilot-lightbox" id="pilot-zoom" aria-label="Enlarged product photo"><form method="dialog"><button class="pilot-close" aria-label="Close photo">×</button></form><img alt="'+esc(p.title)+'" width="640" height="640" referrerpolicy="no-referrer"></dialog>'
  });
}

const sorts = {'':'Featured',low:'Price low–high',high:'Price high–low',name:'Name'};
function catalogPage(url) {
  const keys=['department','brand','category','min','max','stock','sort'];
  const filters=Object.fromEntries(keys.map(k=>[k,url.searchParams.get(k)||'']));
  const brands=[...new Set(products.map(p=>p.brand).filter(Boolean))].sort();
  const categories=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();
  const validNumber = text => /^\d+(?:\.\d{1,2})?$/.test(text);
  const found = products.filter(p=>(!filters.department||p.department===filters.department)&&(!filters.brand||p.brand===filters.brand)&&
    (!filters.category||p.category===filters.category)&&(!validNumber(filters.min)||p.price>=Number(filters.min))&&
    (!validNumber(filters.max)||p.price<=Number(filters.max))&&(filters.stock!=='1'||p.in_stock));
  if(filters.sort==='low')found.sort((a,b)=>a.price-b.price);
  if(filters.sort==='high')found.sort((a,b)=>b.price-a.price);
  if(filters.sort==='name')found.sort((a,b)=>a.title.localeCompare(b.title));
  const pageCount=Math.max(1,Math.ceil(found.length/24));
  const page=Math.min(pageCount,Math.max(1,Number.parseInt(url.searchParams.get('page')||'1',10)||1));
  const shown=found.slice((page-1)*24,page*24);
  const title=groups.get(filters.department)||'Shop the catalog';
  const option=(key,label,value)=>'<option value="'+esc(value)+'"'+(filters[key]===value?' selected':'')+'>'+esc(label)+'</option>';
  const hidden=key=>filters[key]?'<input type="hidden" name="'+key+'" value="'+esc(filters[key])+'">':'';
  const select=(key,label,options)=>'<label>'+label+'<select name="'+key+'">'+option(key,'All','')+options.map(v=>option(key,v,v)).join('')+'</select></label>';
  const chips=[['department',groups.get(filters.department)],['brand',filters.brand],['category',filters.category],
    ['min',validNumber(filters.min)?'From '+money(Number(filters.min)):''],
    ['max',validNumber(filters.max)?'Up to '+money(Number(filters.max)):''],['stock',filters.stock==='1'?'In stock':'']]
    .filter(([,value])=>value).map(([key,value])=>'<a class="pilot-filter-chip" aria-label="Remove filter: '+esc(value)+'" href="'+esc(catalogUrl({...filters,[key]:''}))+'">'+esc(value)+' <span aria-hidden="true">×</span></a>').join('');
  return layout({title,description:'Browse Elvarins products by department, brand, price and availability.',body:
    bread([],title)+'<section class="pilot-banner"><div><h1>'+esc(title)+'</h1><p>Find the right item by brand, category, price or availability.</p></div></section>'+
    '<div class="pilot-catalog-top"><p>'+found.length+(found.length===1?' result':' results')+'</p>'+
    '<button class="pilot-button pilot-outline pilot-filter-trigger" type="button" data-open-dialog="pilot-filters">Filters</button>'+
    '<form method="get" action="'+root+'/catalog" class="pilot-sort">'+keys.filter(k=>k!=='sort').map(hidden).join('')+
    '<label>Sort <select name="sort">'+Object.entries(sorts).map(([k,v])=>option('sort',v,k)).join('')+'</select></label><button type="submit" class="pilot-button pilot-outline">Apply</button></form></div>'+
    (chips?'<nav class="pilot-filter-chips" aria-label="Active filters">'+chips+'<a href="'+catalogUrl()+'">Clear filters</a></nav>':'')+
    '<div class="pilot-catalog"><dialog class="pilot-filters" id="pilot-filters" aria-labelledby="pilot-filter-heading" open><form method="dialog" class="pilot-filter-close"><button class="pilot-close" aria-label="Close filters">×</button></form>'+
    '<h2 id="pilot-filter-heading">Filters</h2><form method="get" action="'+root+'/catalog" class="pilot-filter-form">'+hidden('department')+hidden('sort')+
    select('brand','Brand',brands)+select('category','Category',categories)+
    ['min','max'].map(k=>'<label>'+(k==='min'?'Minimum price':'Maximum price')+'<input name="'+k+'" type="number" min="0" step="0.01" value="'+esc(validNumber(filters[k])?filters[k]:'')+'"></label>').join('')+
    '<label class="pilot-check"><input type="checkbox" name="stock" value="1"'+(filters.stock==='1'?' checked':'')+'> In stock only</label><button class="pilot-button" type="submit">Apply filters</button><a href="'+catalogUrl()+'">Clear filters</a></form></dialog>'+
    '<div>'+(shown.length?'<div class="pilot-grid">'+shown.map(card).join('')+'</div>':
    '<div class="pilot-empty"><h2>No matching products</h2><p>Try adjusting your filters.</p><a class="pilot-button" href="'+catalogUrl()+'">Clear filters</a></div>')+
    (pageCount>1?'<nav class="pilot-pagination" aria-label="Catalog pages">'+(page>1?'<a rel="prev" href="'+esc(catalogUrl({...filters,page:page-1}))+'">Previous</a>':'')+'<span>Page '+page+' of '+pageCount+'</span>'+
      (page<pageCount?'<a rel="next" href="'+esc(catalogUrl({...filters,page:page+1}))+'">Next</a>':'')+'</nav>':'')+'</div></div>'+
    shown.map(p=>'<dialog id="pilot-quick-'+esc(p.id)+'" class="pilot-dialog" aria-labelledby="quick-title-'+esc(p.id)+'"><form method="dialog"><button class="pilot-close" aria-label="Close quick view">×</button></form>'+
    '<div class="pilot-card-media">'+image(p.images[0],p.title)+'</div><h2 id="quick-title-'+esc(p.id)+'">'+esc(p.title)+'</h2><p class="pilot-card-price">'+money(p.price)+'</p>'+stock(p)+
    '<p><a href="'+to(p)+'">View full details</a></p>'+ action(p)+'</dialog>').join('')
  });
}

function specPage() {
  return layout({title:'Template specification',description:'Internal Elvarins product and catalog template pilot.',commerce:false,body:
    bread([],'Template specification')+'<h1>Template specification</h1><p>Preview: <a href="'+to(products[0])+'">Product template</a> · <a href="'+root+'/catalog">Catalog template</a></p>'+
    '<table class="pilot-spec-table"><caption>Layout and sizing</caption><tbody>'+
    [['Desktop product','1,280 px maximum container; 24 px side padding; 58/42 gallery / buy box at 1,024 px and above.'],
     ['Gallery','1:1 image box, up to 640 px; 72 × 72 px thumbnails, 8 px gaps. Mobile uses swipe and 44 px dot tap areas.'],
     ['Buy box','Brand 14 px; title 26/21 px; price 30 px; stock 14 px; facts 13 px with 32 px minimum height.'],
     ['Purchase controls','44 px quantity; 52 px primary action on desktop and 48 px on mobile; 16 px text; 12 px radius.'],
     ['Mobile action','64 px bottom bar plus device safe-area inset.'],
     ['Detail content','Two columns in specification tables. Label column is 35%, type is 15 px.'],
     ['Catalog','260 px desktop filter sidebar; 4/3/2 columns with 24 px gaps; 24 results per page. Banner ratio 1440:320.'],
     ['Cards','Square image; brand 12 px; title 15 px in two lines; price 18 px; stock 12 px; 44 px purchase and Quick View tap targets.'],
     ['Motion','250 ms hover motion and image fade. Reduced-motion preferences remove optional animation.']]
    .map(([a,b])=>'<tr><th scope="row">'+esc(a)+'</th><td>'+esc(b)+'</td></tr>').join('')+'</tbody></table>'
  });
}

export function isTemplatePilot(path) { return path===root || path.startsWith(root+'/'); }

export function templatePilotResponse(request, paymentLive) {
  const url=new URL(request.url), path=url.pathname;
  const respond=(content,type='text/html; charset=utf-8',status=200)=>new Response(request.method==='HEAD'?null:content,{
    status,headers:{'Content-Type':type,'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'}
  });
  if(!['GET','HEAD'].includes(request.method))return respond('Method not allowed','text/plain; charset=utf-8',405);
  if(path===root+'/layout.css')return respond(pilotStyles,'text/css; charset=utf-8');
  if(path===root+'/layout.js')return respond(pilotClient,'text/javascript; charset=utf-8');
  if(path===root+'/catalog')return respond(catalogPage(url));
  if(path===root||path===root+'/spec')return respond(specPage());
  const product=products.find(p=>to(p)===path);
  return product?respond(productPage(product,paymentLive)):respond('Preview page not found','text/plain; charset=utf-8',404);
}
