(()=>{'use strict';
const KEY='elvarins-cart-v1', fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
let catalog=[], cart={}, checkoutAvailable=false;
const $=id=>document.getElementById(id);
const safe=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(cart))}catch{}};
const bySku=()=>new Map(catalog.map(p=>[p.sku,p]));
const dialog=document.createElement('dialog');dialog.id='elv-cart-dialog';dialog.className='elv-cart-dialog';
dialog.innerHTML='<div class="elv-cart-shell"><header><h2>Your shopping cart</h2><button type="button" data-cart-close aria-label="Close cart">×</button></header><div class="elv-cart-items" id="elv-cart-items"></div><footer><div id="elv-cart-subtotal"></div><p class="elv-cart-note">Shipping and sales tax are not included. Product stock and order availability must be confirmed before payment.</p><button type="button" id="elv-cart-checkout">Continue to checkout</button><p id="elv-cart-status" role="status" aria-live="polite"></p></footer></div>';
document.body.append(dialog);
const launcher=document.createElement('button');launcher.type='button';launcher.className='elv-cart-launcher';launcher.setAttribute('aria-label','Open shopping cart');launcher.innerHTML='Cart <span id="elv-cart-count">0</span>';document.body.append(launcher);
const panel=$('elv-cart-items'),subtotal=$('elv-cart-subtotal'),status=$('elv-cart-status'),checkout=$('elv-cart-checkout');
const open=()=>{render();dialog.showModal()},close=()=>dialog.close();
launcher.addEventListener('click',open);
dialog.querySelector('[data-cart-close]').addEventListener('click',close);
dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
function entries(){const map=bySku();return Object.entries(cart).map(([sku,quantity])=>({p:map.get(sku),quantity})).filter(x=>x.p)}
function render(){
 const map=bySku();for(const sku of Object.keys(cart))if(!map.has(sku)||!Number.isInteger(cart[sku])||cart[sku]<1||cart[sku]>10)delete cart[sku];
 save();const list=entries();panel.replaceChildren();let total=0,count=0;
 for(const {p,quantity} of list){
  total+=Math.round(Number(p.price)*100)*quantity;count+=quantity;
  const item=document.createElement('div');item.className='elv-cart-item';
  const img=document.createElement('img');const image=p.thumbnail||p.image;if(image)img.src=image;else img.hidden=true;img.alt='';img.loading='lazy';
  const body=document.createElement('div');const title=document.createElement('strong');title.textContent=p.title;
  const price=document.createElement('p');price.textContent=fmt(p.price)+' each';
  const controls=document.createElement('div');controls.className='elv-cart-controls';
  const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','Decrease '+p.title);
  const qty=document.createElement('span');qty.textContent=quantity;
  const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Increase '+p.title);
  const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.className='elv-cart-remove';
  minus.addEventListener('click',()=>change(p.sku,quantity-1));plus.addEventListener('click',()=>change(p.sku,quantity+1));remove.addEventListener('click',()=>change(p.sku,0));
  controls.append(minus,qty,plus,remove);body.append(title,price,controls);item.append(img,body);panel.append(item);
 }
 if(!list.length){const el=document.createElement('p');el.textContent='Your cart is empty. Browse the catalog to add your favorites.';panel.append(el)}
 $('elv-cart-count').textContent=count;subtotal.textContent='Items subtotal: '+fmt(total/100);checkout.disabled=!list.length||!checkoutAvailable;
}
function change(sku,quantity){if(!bySku().has(sku))return;if(quantity<=0)delete cart[sku];else cart[sku]=Math.min(10,Math.max(1,quantity));render()}
function add(sku){if(!bySku().has(sku))return;const requested=Number($('shipping-qty')?.value||1);const quantity=Number.isInteger(requested)&&requested>=1&&requested<=10?requested:1;change(sku,(cart[sku]||0)+quantity);open()}
function inject(){
 document.querySelectorAll('.product-card[data-sku]').forEach(card=>{
  if(card.querySelector('[data-elv-cart-add]'))return;
  const sku=card.dataset.sku;if(!bySku().has(sku))return;
  const button=document.createElement('button');button.type='button';button.className='elv-add-to-cart';button.textContent='Add to cart';button.dataset.elvCartAdd=sku;
  card.append(button);
 });
}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-elv-cart-add]');if(btn){e.preventDefault();e.stopPropagation();add(btn.dataset.elvCartAdd);if(btn.hasAttribute('data-elv-buy-now')&&!checkout.disabled)checkout.click()}});
checkout.textContent='Checkout setup in progress';
checkout.addEventListener('click',async()=>{
 const items=entries().map(({p,quantity})=>({sku:p.sku,quantity}));
 if(!items.length||!checkoutAvailable){status.textContent='Online payment is not available yet. Your cart remains saved on this device.';return;}
 checkout.disabled=true;status.textContent='Preparing secure checkout…';
 try{
  const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items}),credentials:'same-origin',signal:AbortSignal.timeout(20000)});
  const data=await r.json();
  if(!r.ok)throw Error(data.message||'Checkout is unavailable');
  if(!data.url||!data.url.startsWith('https://checkout.stripe.com/'))throw Error('Unexpected payment destination');
  location.assign(data.url);
 }catch(err){status.textContent=(err.message||'Checkout is unavailable')+' Please contact us if you need help.';checkout.disabled=false;}
});

async function start(){
 const embedded=$('catalog-data');if(embedded){try{catalog=JSON.parse(embedded.textContent)}catch{}}
 if(!catalog.length){try{const res=await fetch('/catalog/products.json');if(!res.ok)throw Error();catalog=(await res.json()).products||[]}catch{status.textContent='Catalog unavailable';return}}
 const saved=safe();
 const bciUpc=document.querySelector('.kitchen-purchase-actions [data-order-upc], main [data-order-upc]')?.textContent.trim();
 const bciSku=/^\d{12}$/.test(bciUpc||'')?'bci-'+bciUpc:'';
 const bciIds=[...new Set([bciSku,...Object.keys(saved).filter(sku=>/^bci-\d{12}$/.test(sku))])].filter(Boolean).slice(0,25);
 const query=new URLSearchParams();bciIds.forEach(sku=>query.append('sku',sku));
 try{
  const r=await fetch('/api/checkout?'+query,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)});
  const state=await r.json();checkoutAvailable=r.ok&&state.available===true;
  if(r.ok&&Array.isArray(state.catalogItems))catalog.push(...state.catalogItems);
 }catch{checkoutAvailable=false}
 checkout.textContent=checkoutAvailable?'Proceed to secure checkout':'Checkout setup in progress';
 cart=saved;render();inject();
 const bciActions=document.querySelector('.kitchen-purchase-actions');
 if(bciActions&&bciSku&&bySku().has(bciSku))bciActions.addEventListener('click',event=>{
  const button=event.target.closest('[data-kitchen-action]');
  if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  add(bciSku);
  if(button.dataset.kitchenAction==='buy'&&!checkout.disabled)checkout.click();
 },true);
 const grid=$('product-grid');if(grid)new MutationObserver(()=>inject()).observe(grid,{childList:true});
 const quick=$('product-dialog');if(quick){const target=quick.querySelector('#detail-page')?.parentElement||quick.querySelector('.detail-copy');if(target&&!quick.querySelector('#elv-quick-add')){const b=document.createElement('button');b.id='elv-quick-add';b.type='button';b.className='elv-add-to-cart';b.textContent='Add to cart';target.append(b);b.addEventListener('click',()=>{const sku=$('detail-sku')?.textContent?.trim();if(sku)add(sku)})}}

 const detailSku=$('product-data');if(detailSku){try{const p=JSON.parse(detailSku.textContent),where=$('detail-inquiry')||$('shipping-form');if(p?.sku&&where){const b=document.createElement('button');b.type='button';b.className='elv-add-to-cart elv-detail-add';b.textContent='Add to cart';b.dataset.elvCartAdd=p.sku;where.insertAdjacentElement('beforebegin',b)}}catch{}}
 document.querySelectorAll('[data-product-question]').forEach(b=>{b.hidden=false});
 if(new URLSearchParams(location.search).has('cart'))open();
}
start();
})();
