(()=>{'use strict';
const KEY='elvarins-cart-v1', fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
let catalog=[], cart={};
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
  const img=document.createElement('img');img.src=p.thumbnail||p.image;img.alt='';img.loading='lazy';
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
 $('elv-cart-count').textContent=count;subtotal.textContent='Items subtotal: '+fmt(total/100);checkout.disabled=!list.length;status.textContent='';
}
function change(sku,quantity){if(!bySku().has(sku))return;if(quantity<=0)delete cart[sku];else cart[sku]=Math.min(10,Math.max(1,quantity));render()}
function add(sku){if(!bySku().has(sku))return;change(sku,(cart[sku]||0)+1);open()}
function inject(){
 document.querySelectorAll('.product-card[data-sku]').forEach(card=>{
  if(card.querySelector('[data-elv-cart-add]'))return;
  const sku=card.dataset.sku;if(!bySku().has(sku))return;
  const button=document.createElement('button');button.type='button';button.className='elv-add-to-cart';button.textContent='Add to cart';button.dataset.elvCartAdd=sku;
  card.append(button);
 });
}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-elv-cart-add]');if(btn){e.preventDefault();e.stopPropagation();add(btn.dataset.elvCartAdd)}});
checkout.addEventListener('click',()=>{
 status.textContent='Payments are not enabled yet. Stock, shipping and tax must be verified before we can accept your order.';
 const skus=entries().map(({p,quantity})=>p.sku+' × '+quantity).join(', ');
 const msg='Please confirm stock, shipping, tax, and payment availability for: '+skus;
 let anchor=$('elv-cart-contact');if(!anchor){anchor=document.createElement('a');anchor.id='elv-cart-contact';anchor.textContent='Request order confirmation';anchor.className='elv-cart-contact';checkout.insertAdjacentElement('afterend',anchor)}
 anchor.href='/contact?order='+encodeURIComponent(msg);
});
async function start(){
 const embedded=$('catalog-data');if(embedded){try{catalog=JSON.parse(embedded.textContent)}catch{}}
 if(!catalog.length){try{const res=await fetch('/catalog/products.json');if(!res.ok)throw Error();catalog=(await res.json()).products||[]}catch{status.textContent='Catalog unavailable';return}}
 cart=safe();render();inject();
 const grid=$('product-grid');if(grid)new MutationObserver(()=>inject()).observe(grid,{childList:true});
}
start();
})();