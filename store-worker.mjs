import legacy from './worker.mjs';
import { products, renderProduct } from './product-pages.mjs';
import { checkoutApi } from './checkout-api.mjs';
import { findBciCheckoutProduct } from './bci-catalog.mjs';
import { featuredKitchenMarkup, findServiceCheckoutProduct, isRetiredKitchenPath, isRetiredKitchenSku, renderNotFound, servicePaths, updateKitchenCards } from './service-pages.mjs';
import { adminPath, collections, editablePages, escape, safeJson, manageStore, mergeCatalog } from './store-management.mjs';
import { addLayout, getLayout, layoutScript, photoUploadPath, sendTracking, servePhoto } from './store-extensions.mjs';
import { presentProduct, productPresentationCss } from './product-presentation.mjs';
import { supplierStorefront } from './supplier-storefront.mjs';
import { featuredKitchenPhoto, refreshCart, refreshCss, refreshHtml, refreshPromo, refreshScript } from './storefront-refresh.mjs';

import { FREE_SHIPPING_CENTS, promoScript, promoStyles, renderShippingPromo, shippingOfferCopy } from './shipping-offer.mjs';

const storefrontCatalog='/catalog/products.json';
const lookupLegacy=sku=>{
  const row=findBciCheckoutProduct(sku)||findServiceCheckoutProduct(sku);
  if(!row)return undefined;
  const slug=sku.startsWith('page-')?sku.slice(5):sku;
  return {...row,slug,url:'/products/'+slug,collection:row.collection||(/^bci-/.test(sku)?'pet-supplies':'collectibles'),published:true,inStock:true};
};
const customerRoute='/api/account/admin';
const prepRoute='/api/account/fulfillment';
const compactCss=`
.retail-kitchen-grid{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr) minmax(190px,.72fr);align-items:start;gap:clamp(.85rem,2vw,1.65rem);padding:clamp(.8rem,2vw,1.55rem);border:1px solid #d7e0ea;border-radius:16px;background:#fff}
.retail-kitchen-grid .detail-photo{min-width:0;margin:0}
.retail-kitchen-grid .detail-photo [data-gallery-image]{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain;border-radius:12px;background:#f5f7fa}
.retail-kitchen-grid .kitchen-product-details h2{margin:.6rem 0;font-size:1.12rem}
.retail-kitchen-grid .kitchen-product-details ul{padding-inline-start:1.2rem;display:grid;gap:.5rem;margin:.55rem 0 1rem}
.retail-kitchen-grid .kitchen-product-details dl{display:grid;grid-template-columns:minmax(0,auto) minmax(0,1fr);gap:.45rem .85rem}
.retail-kitchen-grid .kitchen-product-details dd{margin:0;overflow-wrap:anywhere}
.retail-kitchen-grid .retail-buy-box{min-width:0;margin:0}
.retail-kitchen-grid .kitchen-retail-price strong{font-size:1.5rem}
.retail-kitchen-grid :is(.kitchen-purchase-actions button,#buy-quantity){min-height:44px}
.retail-kitchen-grid .kitchen-purchase-actions{display:grid;gap:.5rem;margin-top:.7rem}
.retail-kitchen-grid .kitchen-purchase-actions button{width:100%}
@media(max-width:720px){
  main .retail-kitchen-grid .detail-photo [data-gallery-image]{max-height:230px}
  main .retail-kitchen-grid .retail-buy-box{order:1}
  main .retail-kitchen-grid .kitchen-product-details{font-size:.95rem}
}

main h1,.hero h1{font-family:inherit;font-weight:800;letter-spacing:-.035em;line-height:1.13;font-size:clamp(1.65rem,3.6vw,2.75rem);overflow-wrap:anywhere}
.hero h1{font-size:clamp(2rem,5.2vw,4rem)}
main h2{font-family:inherit;font-weight:750;letter-spacing:-.025em;line-height:1.2;font-size:clamp(1.25rem,2.25vw,1.85rem)}
main :is(.product-card,.discovery-product,.department-product,.help-tile) :is(h2,h3,h4){font-family:inherit;font-size:clamp(.92rem,1.25vw,1.05rem);font-weight:700;line-height:1.35;letter-spacing:0;overflow-wrap:anywhere}
main :is(.product-card,.discovery-product,.department-product,.help-tile) :is(h2,h3,h4) a{color:inherit;text-decoration:none}
main :is(.product-card,.discovery-product,.department-product,.help-tile) :is(h2,h3,h4) a:hover{text-decoration:underline;text-underline-offset:.18em}
#account-dialog{width:min(100% - 1.5rem,29rem);border:1px solid #d4dce9;border-radius:18px;padding:clamp(1rem,4vw,1.75rem);box-shadow:0 22px 70px #17243a45;max-height:calc(100dvh - 1.5rem);overflow:auto}
#account-dialog .dialog-intro h2{font-size:1.55rem;line-height:1.15;margin:.4rem 0}
#account-dialog .dialog-intro p{margin:.4rem 0 1rem}
#account-dialog .account-tabs{display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.85rem}
#account-dialog .account-tabs button{flex:1;min-height:40px;font-size:.82rem}
#account-dialog .service-form{gap:.65rem}
#account-dialog .service-form input{min-height:44px;font-size:16px}
#account-dialog [hidden]{display:none!important}
#account-dialog #account-status:not(:empty),#account-dialog .checkout-account-notice{padding:.65rem .8rem;border-radius:.5rem;background:#edf3fc;color:#17345b;margin:.5rem 0 0}
#account-dialog #account-submit{min-height:44px}
#account-dialog #account-status:not(:empty){margin:0 0 .8rem}
#account-dialog #account-status[data-tone="error"]{background:#fff0ef;color:#941e25;border:1px solid #e9a2a2;border-left:4px solid #bd2930;font-weight:600}
#account-dialog #account-status[data-tone="error"]:focus{outline:2px solid #bd2930;outline-offset:2px}
@media(prefers-reduced-motion:no-preference){#account-dialog #account-status[data-tone="error"]{animation:account-error-in .2s ease-out}@keyframes account-error-in{from{opacity:.5;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}}
header .elv-header-cart{position:static;inset:auto;grid-area:cart;margin:0;box-shadow:none;min-height:40px;white-space:nowrap;padding:.45rem .65rem}
.product-card,.department-product,.discovery-product,.help-tile{min-width:0}
.help-tile .elv-add-to-cart,.department-product .elv-add-to-cart{width:100%;margin:.4rem 0 0}
article:has(a[href^="/products/"]) :is(.gallery-card-badge,.stock-label,button.product-action[data-product]){display:none!important}
article .elv-view-details{display:inline-flex;align-items:center;min-height:36px;font-size:.84rem;font-weight:650;text-underline-offset:.18em}
@media(max-width:720px){
header .nav:has(.elv-header-cart){display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;grid-template-areas:"logo links cart toggle" "search search search search";gap:.38rem;padding-block:.45rem;align-items:center}
header .nav:has(.elv-header-cart) .logo{grid-area:logo;font-size:clamp(.96rem,5vw,1.28rem);gap:.22rem;white-space:nowrap}
header .nav:has(.elv-header-cart) .logo img{width:29px;height:29px}
header .nav:has(.elv-header-cart) .navlinks{display:none}
header .nav:has(.elv-header-cart) .account-trigger{grid-area:links;justify-self:end;margin:0}
header .nav:has(.elv-header-cart) .account-trigger{font-size:.7rem;padding:.3rem;min-height:38px}
header .nav:has(.elv-header-cart) .header-search{grid-area:search;width:100%;min-width:0;margin:0}
header .nav:has(.elv-header-cart) #navtoggle{grid-area:toggle;margin:0;min-height:40px;padding:.3rem .45rem}
header .nav:has(.elv-header-cart) #mobilemenu:not([hidden]){grid-column:1/-1;min-width:0}
header .business-links{display:none}
main .retail-pdp-grid,main .kitchen-pdp,main .retail-bci-layout{display:flex!important;flex-direction:column;gap:.65rem;padding:.7rem}
main .retail-pdp-grid .detail-copy{order:1;padding:.55rem}
main .retail-pdp-grid .detail-photo{order:0;padding:.25rem}
main .retail-buy-box{order:2;width:100%;min-width:0;margin:0;padding:.7rem}
main :is(.retail-pdp-grid,.service-page-heading,.collection-hero) h1{font-size:clamp(1.4rem,5.4vw,1.75rem);line-height:1.15;margin:.3rem 0}
main .retail-pdp-grid .detail-photo img[data-gallery-image],main .kitchen-pdp [data-gallery-image],main .retail-bci-layout>img{max-height:clamp(145px,39vw,200px);width:100%;object-fit:contain}
main .gallery-thumbs img,main .kitchen-gallery-thumbs img{width:43px!important;height:43px!important;object-fit:contain}
main .service-page-heading{padding-block:.45rem;margin-block:0 .6rem}
main .service-page-heading p{margin:.25rem 0}
}
`;
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
  return shippingOfferCopy(source)
    .replace('FREE_SHIPPING_CENTS=4901','FREE_SHIPPING_CENTS='+FREE_SHIPPING_CENTS)
    .replace('max="4901"', 'max="'+FREE_SHIPPING_CENTS+'"')
    .replace('initProductReviews();','')
    .replace('<div id="elv-cart-subtotal"></div>','<div id="elv-cart-subtotal"></div><p>Shipping and tax, if applicable, are calculated at checkout. Sign in or create an account to continue.</p>')
    .replace('document.body.append(launcher);',"const menu=document.getElementById('navtoggle');const nav=menu?.parentElement||document.querySelector('header .nav');if(nav){launcher.classList.add('elv-header-cart');menu?menu.before(launcher):nav.append(launcher);}else document.body.append(launcher);")
    .replace('.product-card[data-sku], .discovery-product, .department-product','.product-card[data-sku], .discovery-product, .department-product, .help-tile:not([data-no-cart])')
    .replace("if(card.querySelector('[data-elv-cart-add], .stock-label'))return;","if(card.querySelector('[data-elv-cart-add]'))return;")
    .replace('card.append(badge,button);','card.append(button);')
    .replace("if(!r.ok)throw Error(data.message||'Checkout is unavailable');",`if(r.status===401&&data.code==='SIGN_IN_REQUIRED'){
     dialog.close();document.querySelector('[data-open-account="login"]')?.click();
     const account=document.getElementById('account-dialog');
     const notice=document.createElement('p');notice.textContent='Sign in or create an account to continue. Your cart is saved.';notice.setAttribute('role','status');
     if(account?.open){account.prepend(notice);account.addEventListener('close',()=>{notice.remove();open();},{once:true});}
     else{open();status.textContent=notice.textContent;}checkout.disabled=false;return;
   }
   if(!r.ok)throw Error(data.message||'Checkout is unavailable');`)
    .replace("if(!bySku().has(sku))return;const requested","if(!bySku().has(sku)||bySku().get(sku).inStock===false)return;const requested")
    .replace("if(card.querySelector('[data-elv-cart-add]'))return;","if(card.querySelector('[data-elv-cart-add], .stock-label'))return;")
    .replace("if(!sku)return;\n  const button","if(!sku||bySku().get(sku)?.inStock===false)return;\n  const button")
    .replace("/^(?:bci-\\d{12}|page-[a-z0-9-]+)$/.test(sku)","/^(?:page-[a-z0-9-]+|[A-Za-z0-9][A-Za-z0-9_-]{0,47})$/.test(sku)")
    .replace("if(r.ok&&Array.isArray(state.catalogItems))catalog.push(...state.catalogItems);","if(r.ok&&Array.isArray(state.catalogItems)){const fresh=new Map(state.catalogItems.map(p=>[p.sku,p]));catalog=catalog.filter(p=>!fresh.has(p.sku));catalog.push(...fresh.values());}")
    .replace("if(!map.has(sku)||!Number.isInteger","if(!map.has(sku)||map.get(sku).inStock===false||!Number.isInteger")
    .replace("if(!sku)return;add(sku);if(!checkout.disabled)","if(!sku||bySku().get(sku)?.inStock===false)return;add(sku);if(!checkout.disabled)")
    .replace("add(sku);\n if(btn.hasAttribute","if(bySku().get(sku)?.inStock===false)return;\n add(sku);\n if(btn.hasAttribute");
}

function cleanProductCards(html){
  return html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g,card=>{
    const path=card.match(/href="(\/products\/[a-z0-9-]+)"/)?.[1];
    if(!path)return card;
    return card
      .replace(/<(p|span)\b[^>]*>\s*(?:In Stock|Out of Stock)\s*<\/\1>/gi,'')
      .replace(/<(button|span)\b[^>]*class="[^"]*\bgallery-card-badge\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g,'')
      .replace(/<button\b[^>]*\bdata-product="[^"]*"[^>]*>[\s\S]*?<\/button>/g,'<a class="elv-view-details" href="'+path+'">View details</a>');
  });
}
function accountMarkup(html){
  const status='<p id="account-status" role="status" aria-live="polite"></p>';
  return html.replace(status,'').replace('<div id="account-auth">','<p id="account-status" role="status" aria-live="polite" tabindex="-1"></p><div id="account-auth">').replace('Keep your favorites close.</h2><p>Create your personal saved collection, ready whenever you return.',
    'Sign in to Elvarins</h2><p>Use your account to check out and keep your saved items.')
    .replace('<p class="form-note">Use at least 14 characters. Keep your private recovery code somewhere safe; you will need it if you forget your password.</p>',
      '<label id="account-confirm-wrap" hidden>Confirm password<input id="account-confirm" type="password" autocomplete="new-password" maxlength="128"></label><p id="account-password-help" class="form-note" hidden>Use at least 14 characters.</p>')
    .replace('<label id="recovery-wrap" hidden>','<label id="account-phone-wrap" hidden>Mobile number (optional)<input id="account-phone" name="phone" type="tel" autocomplete="tel" maxlength="32" placeholder="+1 212 555 0123" disabled></label><label id="recovery-wrap" hidden>')
    .replace('Accounts save your favorites. Track your orders and save your favorite items.','Read how Elvarins handles your account information.');
}

function accountAsset(source){
  return source
    .replace("function auth(mode){","function accountError(message){const status=$('#account-status');status.dataset.tone='error';status.textContent=message;status.focus();}function auth(mode){delete $('#account-status').dataset.tone;")
    .replace("if(!response.ok)throw new Error(data.message||'Please try again.');","if(!response.ok){const error=new Error(data.message||'Please try again.');error.status=response.status;throw error;}")
    .replace("authMode=mode;$('#account-auth')","authMode=mode;const phone=$('#account-phone');if(phone){phone.disabled=mode!=='signup';$('#account-phone-wrap').hidden=mode!=='signup';}const confirm=$('#account-confirm');if(confirm){confirm.value='';confirm.required=mode==='signup';$('#account-confirm-wrap').hidden=mode!=='signup';$('#account-password-help').hidden=mode==='login';}$('#account-title').textContent=mode==='signup'?'Create your Elvarins account':mode==='recover'?'Recover your account':'Sign in to Elvarins';$('#account-auth')")
    .replace("e.preventDefault();if(!e.target.reportValidity())return;const button=$('#account-submit')","e.preventDefault();delete $('#account-status').dataset.tone;if(!e.target.reportValidity())return;if(authMode==='signup'&&$('#account-confirm')&&$('#account-confirm').value!==$('#account-password').value){accountError('Passwords do not match.');return;}const button=$('#account-submit')")
    .replace("catch(error){status.textContent=error.message;}finally{button.disabled=false;}});","catch(error){if(authMode==='signup'&&error.status===409){auth('login');$('#account-password').value='';accountError('Sign in with this email, or choose Recover account if you forgot your password.');}else accountError(error.message);}finally{button.disabled=false;}});");
}
const versionCart=html=>shippingOfferCopy(accountMarkup(cleanProductCards(html))).replace(/\/retail\.js(?:\?v=[^"']*)?/g,'/retail.js?v=account-6').replace(/\/cart\.js(?:\?v=[^"']*)?/g,'/cart.js?v=design-refresh-13').replace('</head>','<link rel="stylesheet" href="/storefront-compact.css?v=14"></head>');
const getRows=async db=>(await db.prepare('SELECT sku,slug,data,published,in_stock,revision FROM storefront_products').all()).results;

async function checkout(request,env,catalog){
  if(request.method==='GET'||request.method==='HEAD'){
    const original=await checkoutApi(request,env,products);
    const state=await original.json();
    state.catalogItems=new URL(request.url).searchParams.getAll('sku').slice(0,25).map(sku=>{
      if(isRetiredKitchenSku(sku))return undefined;
      const p=catalog.get(sku);
      if(!p)return lookupLegacy(sku);
      if(!p.published)return {sku,inStock:false};
      return {sku,title:p.title,price:p.price,url:p.url,image:p.image,thumbnail:p.thumbnail,inStock:p.inStock};
    }).filter(Boolean);
    return transformed(request,original,JSON.stringify(state),'application/json; charset=utf-8');
  }
  if(request.method==='POST'){
    const url=new URL(request.url);
    const session=await legacy.fetch(new Request(url.origin+'/api/account/me',{headers:{Cookie:request.headers.get('Cookie')||''}}),env,{});
    if(!session.ok)return Response.json({message:'Account service is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});
    if(!(await session.json()).user)return Response.json({code:'SIGN_IN_REQUIRED',message:'Sign in or create an account to continue.'},{status:401,headers:{'Cache-Control':'no-store'}});
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
  if(path===adminPath||path===photoUploadPath)return manageStore(request,env,products,lookupLegacy);
  if(path==='/storefront-compact.css')return new Response(request.method==='HEAD'?null:compactCss+productPresentationCss+promoStyles+refreshCss,{headers:{'Content-Type':'text/css; charset=utf-8','Cache-Control':'public, max-age=3600'}});
  if(path==='/media/storefront/kitchen-tools.jpg')return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(featuredKitchenPhoto),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
  if(path==='/storefront-refresh.js')return new Response(request.method==='HEAD'?null:refreshScript,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
  if(path==='/shipping-promo.js')return new Response(request.method==='HEAD'?null:refreshPromo(promoScript),{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
  if(path.startsWith('/media/products/'))return servePhoto(request,db);
  if(path==='/layout-controls.js'){
    if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
    return new Response(request.method==='HEAD'?null:layoutScript,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
  }
  if(path===customerRoute){
    const result=await legacy.fetch(request,env,ctx);
    return result.ok&&request.method==='GET'?transformed(request,result,(await result.text()).replace('<nav aria-label="Dashboard">','<nav aria-label="Dashboard"><a href="'+adminPath+'">Manage storefront</a>')):result;
  }
  if(path===prepRoute)return addTracking(request,env,await legacy.fetch(request,env,ctx));
  if(path==='/api/checkout')return db?checkout(request,env,mergeCatalog(products,await getRows(db))):legacy.fetch(request,env,ctx);
  if(!['GET','HEAD'].includes(request.method))return legacy.fetch(request,env,ctx);
  if(path==='/cart.js'){
    const original=await legacy.fetch(request,env,ctx);
    return transformed(request,original,refreshCart(cartAsset(await original.text())));
  }
  if(path==='/retail.js'){
    const original=await legacy.fetch(request,env,ctx);
    return transformed(request,original,accountAsset(await original.text()));
  }
  if(isRetiredKitchenPath(path))return new Response(request.method==='HEAD'?null:versionCart(renderNotFound()),{status:410,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
  const managedRoute=path==='/'||path===storefrontCatalog||path==='/sitemap.xml'||path.startsWith('/products/')||path.startsWith('/collections/');
  const pageCopy=db&&editablePages.includes(path)?await db.prepare('SELECT heading,body FROM storefront_copy WHERE path=?').bind(path).first():null;
  if(!managedRoute&&!pageCopy&&!servicePaths.includes(path)&&path!=='/order-success')return legacy.fetch(request,env,ctx);
  const rows=db&&managedRoute?await getRows(db):[];
  const catalog=mergeCatalog(products,rows);
  const sourceRequest=request.method==='HEAD'?new Request(request.url,{headers:request.headers}):request;
  if(path.startsWith('/products/')){
    const p=[...catalog.values()].find(p=>p.url===path&&p.edited);
    if(p&&!p.published)return new Response(request.method==='HEAD'?null:'Product not found',{status:404,headers:{'Cache-Control':'no-store'}});
    if(p)return transformed(request,null,versionCart(refreshHtml(presentProduct(productPage(p)).replace('</head>','<link rel="stylesheet" href="/cart.css"></head>').replace('</body>','<script src="/cart.js" defer></script></body>'),path)));
  }
  const original=await legacy.fetch(sourceRequest,env,ctx);
  if(!original.ok)return request.method==='HEAD'?new Response(null,original):original;
  const html=(original.headers.get('Content-Type')||'').includes('text/html');
  if(!rows.length&&!pageCopy&&!html)return request.method==='HEAD'?new Response(null,original):original;
  let body=await original.text();
  if(path===storefrontCatalog)body=JSON.stringify({...JSON.parse(body),products:[...catalog.values()].filter(p=>p.published)});
  else if(path==='/sitemap.xml'){
    body=body.replace(/<url>\s*<loc>https:\/\/elvarins\.com(\/products\/[^<]+)<\/loc>[\s\S]*?<\/url>/g,(row, productPath)=>isRetiredKitchenPath(productPath)?'':row);
    for(const p of catalog.values())if(p.edited&&!isRetiredKitchenPath(p.url)){
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
    if(db&&path==='/'){
      const layout=await getLayout(db);
      if(layout)body=addLayout(body,layout);
    }
    if(path.startsWith('/products/'))body=presentProduct(body);
    if(path==='/'||path==='/collections/home-kitchen')body=updateKitchenCards(body);
    if(path==='/')body=renderShippingPromo(body.replace('<section class="section home-only" aria-labelledby="home-kitchen-home">', match=>featuredKitchenMarkup()+match));
    body=versionCart(refreshHtml(supplierStorefront(body,path),path));
  }
  return transformed(request,original,body);
}

export default {
  async scheduled(event,env,ctx){
    ctx.waitUntil(sendTracking(env));
    return legacy.scheduled(event,env,ctx);
  },
  async fetch(request,env,ctx){
    try {return await fetchStore(request,env,ctx);}
    catch(error){
      console.error('storefront-management',error?.name);
      return new Response('Store service temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}});
    }
  },
};
