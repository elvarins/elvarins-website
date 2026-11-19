import legacy from './worker.mjs';
import { products, renderProduct } from './product-pages.mjs';
import { checkoutApi } from './checkout-api.mjs';
import { findBciCheckoutProduct } from './bci-catalog.mjs';
import { findServiceCheckoutProduct } from './service-pages.mjs';
import { adminPath, collections, editablePages, escape, safeJson, manageStore, mergeCatalog } from './store-management.mjs';

const storefrontCatalog='/catalog/products.json';
const lookupLegacy=sku=>{
  const row=findBciCheckoutProduct(sku)||findServiceCheckoutProduct(sku);
  if(!row)return undefined;
  const slug=sku.startsWith('page-')?sku.slice(5):sku;
  return {...row,slug,url:'/products/'+slug,collection:/^bci-/.test(sku)?'pet-supplies':'collectibles',published:true,inStock:true};
};
const customerRoute='/api/account/admin';
const prepRoute='/api/account/fulfillment';
const scriptPattern=/<script id="catalog-data" type="application\/json">([\s\S]*?)<\/script>/;
const withCatalog=(html,catalog)=>html.replace(scriptPattern,()=>'<script id="catalog-data" type="application/json">'+safeJson(catalog)+'</script>');
const price=p=>'$'+p.price.toFixed(2);
const stock=p=>p.inStock?'In Stock':'Out of Stock';
const htmlImg=(url,alt)=>'<img src="'+escape(url)+'" alt="'+escape(alt)+'" width="500" height="500" loading="lazy" referrerpolicy="no-referrer">';
const editProductControls=p=>p.inStock?'<button type="button" class="elv-add-to-cart" data-elv-cart-add="'+escape(p.sku)+'">Add to cart</button>':'';
const productCard=p=>'<article class="product-card" data-sku="'+escape(p.sku)+'" data-collection="'+escape(p.collection)+'"><a class="product-photo" href="'+escape(p.url)+'">'+htmlImg(p.image,p.title)+'</a><div class="product-copy"><span class="brand">'+escape(p.brand)+'</span><h3><a href="'+escape(p.url)+'">'+escape(p.title)+'</a></h3><div class="product-bottom"><span class="price">'+price(p)+'</span><button class="product-action" type="button" data-product="'+escape(p.sku)+'" aria-label="Quick view '+escape(p.title)+'">Quick view</button></div><span class="stock-label">'+stock(p)+'</span>'+editProductControls(p)+'</div></article>';

function productPage(p){
  const shell=renderProduct(p);
  const specs=[['SKU',p.sku],['Manufacturer item number',p.manufacturerSku],['UPC / GTIN',p.gtin12||p.gtin13],['Size',p.size],['Recommended age',p.age],['Package contents',p.contents]];
  const body='<main class="product-page" id="product-main"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/collections/'+escape(p.collection)+'">'+escape(p.collection)+'</a></nav><div class="detail-grid retail-pdp-grid"><div class="detail-photo">'+htmlImg(p.image,p.title)+'<div class="gallery-thumbs">'+p.images.slice(1).map(src=>'<a href="'+escape(src)+'" target="_blank" rel="noopener noreferrer">'+htmlImg(src,p.title)+'</a>').join('')+'</div></div><div class="detail-copy"><span class="brand">'+escape(p.brand)+'</span><h1>'+escape(p.title)+'</h1><p class="description">'+escape(p.description)+'</p>'+
    (p.safetyNote?'<p class="detail-note">'+escape(p.safetyNote)+'</p>':'')+
    '<dl>'+specs.filter(([,v])=>v).map(([k,v])=>'<dt>'+escape(k)+'</dt><dd>'+escape(v)+'</dd>').join('')+'</dl></div><aside class="retail-buy-box"><strong class="price">'+price(p)+'</strong><p>'+stock(p)+'</p>'+
    (p.inStock?'<label for="buy-quantity">Quantity</label><select id="buy-quantity">'+Array.from({length:10},(_,i)=>'<option>'+(i+1)+'</option>').join('')+'</select>'+editProductControls(p)+'<button type="button" class="elv-add-to-cart" data-elv-cart-add="'+escape(p.sku)+'" data-elv-buy-now>Buy now</button>':'')+
    '<p>Sold by Elvarins</p><a href="/shipping-delivery">Shipping</a> · <a href="/returns">Returns</a></aside></div></main>';
  const schema={'@context':'https://schema.org','@type':'Product',name:p.title,sku:p.sku,description:p.description,image:p.images,brand:{'@type':'Brand',name:p.brand},offers:{'@type':'Offer',priceCurrency:'USD',price:p.price,url:'https://elvarins.com'+p.url,availability:'https://schema.org/'+(p.inStock?'InStock':'OutOfStock')},...(p.manufacturerSku?{mpn:p.manufacturerSku}:{}),...(p.gtin12?{gtin12:p.gtin12}:{}),...(p.gtin13?{gtin13:p.gtin13}:{})};
  return shell.replace(/<main\b[\s\S]*?<\/main>/,()=>body)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,()=>'<script type="application/ld+json">'+safeJson(schema)+'</script>')
    .replace(/<script id="product-data" type="application\/json">[\s\S]*?<\/script>/,()=>'<script id="product-data" type="application/json">'+safeJson(p)+'</script>');
}

function updateCards(html,catalog,slug=''){
  return html.replace(/<article\b[^>]*\bdata-sku="([^"]+)"[^>]*>[\s\S]*?<\/article>/g,(all,sku)=>{
    const p=catalog.get(sku);
    return p?.edited?(p.published&&(!slug||slug===p.collection)?productCard(p):''):all;
  });
}

function updateImportedCards(html,catalog){
  const overrides=new Map([...catalog.values()].filter(p=>p.edited&&(p.sku.startsWith('page-')||p.sku.startsWith('bci-'))).map(p=>[p.url,p]));
  if(!overrides.size)return html;
  return html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g,card=>{
    const href=card.match(/href="(\/products\/[^"]+)"/)?.[1];
    const p=overrides.get(href);
    return p?(p.published?productCard(p):''):card;
  });
}

function withEdits(html,path,catalog){
  const slug=path.startsWith('/collections/')?path.slice(13):'';
  const visible=[...catalog.values()].filter(p=>p.published&&(!slug||p.collection===slug));
  html=updateCards(html,catalog,slug);
  const additions=visible.filter(p=>p.edited&&!html.includes('data-sku="'+escape(p.sku)+'"'));
  html=withCatalog(html,visible);
  if(additions.length)html=html.replace(/(<div[^>]*\bid="product-grid"[^>]*>)/,(_,open)=>open+additions.map(productCard).join(''));
  return html;
}

function transformed(request,original,body,contentType){
  const headers=new Headers(original?.headers);
  headers.delete('Content-Length');headers.delete('ETag');headers.delete('Content-Encoding');
  headers.set('Cache-Control','no-store');
  headers.set('Content-Type',contentType||headers.get('Content-Type')||'text/html; charset=utf-8');
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(request.method==='HEAD'?null:body,{status:original?.status||200,headers});
}

function appendCopy(html,copy){
  const body='<section class="section wrap elv-owner-copy"><h2>'+escape(copy.heading)+'</h2>'+copy.body.split(/\n\s*\n/).map(p=>'<p>'+escape(p).replace(/\n/g,'<br>')+'</p>').join('')+'</section>';
  return /<\/main>/.test(html)?html.replace('</main>',()=>body+'</main>'):html.replace('</body>',()=>body+'</body>');
}

function cartAsset(source){
  return source
    .replace("if(!bySku().has(sku))return;const requested","if(!bySku().has(sku)||bySku().get(sku).inStock===false)return;const requested")
    .replace("if(card.querySelector('[data-elv-cart-add]'))return;","if(card.querySelector('[data-elv-cart-add], .stock-label'))return;")
    .replace("if(!sku)return;\n  const button","if(!sku||bySku().get(sku)?.inStock===false)return;\n  const button")
    .replace("/^(?:bci-\\d{12}|page-[a-z0-9-]+)$/.test(sku)","/^[A-Za-z0-9][A-Za-z0-9_-]{0,47}$/.test(sku)")
    .replace("if(r.ok&&Array.isArray(state.catalogItems))catalog.push(...state.catalogItems);","if(r.ok&&Array.isArray(state.catalogItems)){const fresh=new Map(state.catalogItems.map(p=>[p.sku,p]));catalog=catalog.filter(p=>!fresh.has(p.sku));catalog.push(...fresh.values());}")
    .replace("if(!map.has(sku)||!Number.isInteger","if(!map.has(sku)||map.get(sku).inStock===false||!Number.isInteger")
    .replace("if(!sku)return;add(sku);if(!checkout.disabled)","if(!sku||bySku().get(sku)?.inStock===false)return;add(sku);if(!checkout.disabled)")
    .replace("add(sku);\n if(btn.hasAttribute","if(bySku().get(sku)?.inStock===false)return;\n add(sku);\n if(btn.hasAttribute");
}

const versionCart=html=>html.replace(/\/cart\.js(?:\?v=[^"']*)?/g,'/cart.js?v=management-1');
const getRows=async db=>(await db.prepare('SELECT sku,slug,data,published,in_stock,revision FROM storefront_products').all()).results;

async function checkout(request,env,catalog){
  if(request.method==='GET'||request.method==='HEAD'){
    const original=await checkoutApi(request,env,products);
    const state=await original.json();
    state.catalogItems=new URL(request.url).searchParams.getAll('sku').slice(0,25).map(sku=>{
      const p=catalog.get(sku);
      if(!p)return lookupLegacy(sku);
      if(!p.published)return {sku,inStock:false};
      return {sku,title:p.title,price:p.price,url:p.url,image:p.image,thumbnail:p.thumbnail,inStock:p.inStock};
    }).filter(Boolean);
    return transformed(request,original,JSON.stringify(state),'application/json; charset=utf-8');
  }
  const checkoutProducts=[...catalog.values()].map(p=>p.published&&p.inStock?p:{sku:p.sku,price:0});
  return checkoutApi(request,env,checkoutProducts);
}

async function addTracking(request,env,result){
  if(!result.ok||request.method==='HEAD')return result;
  const html=await result.text();
  const ids=[...new Set([...html.matchAll(/<h2>Order ([a-f0-9-]{36})<\/h2>/g)].map(m=>m[1]))];
  if(!ids.length)return transformed(request,result,html);
  const rows=(await env.CUSTOMER_DB.prepare('SELECT order_id,carrier,tracking FROM shipment_tracking WHERE order_id IN ('+ids.map(()=>'?').join(',')+')').bind(...ids).all()).results;
  const statuses=new Map(rows.map(o=>[o.order_id,o]));
  return transformed(request,result,html.replace(/<h2>Order ([a-f0-9-]{36})<\/h2>/g,(heading,id)=>{
    const row=statuses.get(id);
    return row?heading+'<p><strong>Shipment tracking recorded:</strong> '+escape(row.carrier)+' · '+escape(row.tracking)+'</p>':heading;
  }));
}

async function fetchStore(request,env,ctx){
  const {pathname:path}=new URL(request.url);
  const db=env.CUSTOMER_DB;
  if(path===adminPath)return manageStore(request,env,products,lookupLegacy);
  if(path===customerRoute){
    const result=await legacy.fetch(request,env,ctx);
    return result.ok&&request.method==='GET'?transformed(request,result,(await result.text()).replace('<nav aria-label="Dashboard">','<nav aria-label="Dashboard"><a href="'+adminPath+'">Manage storefront</a>')):result;
  }
  if(path===prepRoute)return addTracking(request,env,await legacy.fetch(request,env,ctx));
  if(path==='/api/checkout')return db?checkout(request,env,mergeCatalog(products,await getRows(db))):legacy.fetch(request,env,ctx);
  if(!['GET','HEAD'].includes(request.method))return legacy.fetch(request,env,ctx);
  if(path==='/cart.js'){
    const original=await legacy.fetch(request,env,ctx);
    return transformed(request,original,cartAsset(await original.text()));
  }
  const managedRoute=path==='/'||path===storefrontCatalog||path==='/sitemap.xml'||path.startsWith('/products/')||path.startsWith('/collections/');
  const pageCopy=db&&editablePages.includes(path)?await db.prepare('SELECT heading,body FROM storefront_copy WHERE path=?').bind(path).first():null;
  if(!managedRoute&&!pageCopy)return legacy.fetch(request,env,ctx);
  const rows=db&&managedRoute?await getRows(db):[];
  const catalog=mergeCatalog(products,rows);
  const sourceRequest=request.method==='HEAD'?new Request(request.url,{headers:request.headers}):request;
  if(path.startsWith('/products/')){
    const p=[...catalog.values()].find(p=>p.url===path&&p.edited);
    if(p&&!p.published)return new Response(request.method==='HEAD'?null:'Product not found',{status:404,headers:{'Cache-Control':'no-store'}});
    if(p)return transformed(request,null,versionCart(productPage(p)).replace('</head>','<link rel="stylesheet" href="/cart.css"></head>').replace('</body>','<script src="/cart.js?v=management-1" defer></script></body>'));
  }
  const original=await legacy.fetch(sourceRequest,env,ctx);
  if(!original.ok)return request.method==='HEAD'?new Response(null,original):original;
  const html=(original.headers.get('Content-Type')||'').includes('text/html');
  if(!rows.length&&!pageCopy&&!html)return request.method==='HEAD'?new Response(null,original):original;
  let body=await original.text();
  if(path===storefrontCatalog)body=JSON.stringify({...JSON.parse(body),products:[...catalog.values()].filter(p=>p.published)});
  else if(path==='/sitemap.xml'){
    for(const p of catalog.values())if(p.edited){
      body=body.replace(/<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g,(row,loc)=>loc==='https://elvarins.com'+p.url?'':row);
      if(p.published)body=body.replace('</urlset>','<url><loc>https://elvarins.com'+p.url+'</loc></url></urlset>');
    }
  }else if(html){
    if(rows.length){
      body=updateImportedCards(body,catalog);
      if(path==='/'||collections.some(slug=>path==='/collections/'+slug))body=withEdits(body,path,catalog);
      else body=updateCards(body,catalog);
    }
    if(pageCopy)body=appendCopy(body,pageCopy);
    body=versionCart(body);
  }
  return transformed(request,original,body);
}

export default {
  scheduled:legacy.scheduled,
  async fetch(request,env,ctx){
    try {return await fetchStore(request,env,ctx);}
    catch(error){
      console.error('storefront-management',error?.name);
      return new Response('Store service temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}});
    }
  },
};
