
'use strict';
const products=JSON.parse(document.getElementById('catalog-data').textContent);
const bySku=new Map(products.map(p=>[p.sku,p]));
const grid=document.getElementById('product-grid');
const cards=new Map(Array.from(grid.querySelectorAll('.product-card')).map(el=>[el.dataset.sku,el]));
const search=document.getElementById('product-search'), brand=document.getElementById('brand-filter'), type=document.getElementById('type-filter'), sort=document.getElementById('product-sort');
let selectedUnit='single',limit=12;
const count=document.getElementById('result-count'), more=document.getElementById('load-more'), empty=document.getElementById('empty-results');
function update(reset=true){
 if(reset)limit=12;
 const term=search.value.trim().toLocaleLowerCase();
 const result=products.filter(p=>(!term||(p.title+' '+p.brand+' '+p.productType+' '+p.sku).toLocaleLowerCase().includes(term))&&(!brand.value||p.brand===brand.value)&&(!type.value||p.productType===type.value));
 if(sort.value==='price-asc')result.sort((a,b)=>a.price-b.price);
 if(sort.value==='price-desc')result.sort((a,b)=>b.price-a.price);
 if(sort.value==='name')result.sort((a,b)=>a.title.localeCompare(b.title));
 cards.forEach(c=>c.hidden=true);
 result.slice(0,limit).forEach(p=>{const card=cards.get(p.sku);card.hidden=false;grid.appendChild(card);});
 count.textContent=result.length+' product'+(result.length===1?'':'s')+' · showing '+Math.min(limit,result.length);
 more.hidden=result.length<=limit;empty.hidden=result.length>0;grid.hidden=result.length===0;
}
document.getElementById('catalog-filters').addEventListener('submit',e=>e.preventDefault());
search.addEventListener('input',()=>update());[brand,type,sort].forEach(e=>e.addEventListener('change',()=>update()));
document.querySelectorAll('[data-unit]').forEach(b=>b.addEventListener('click',()=>{selectedUnit=b.dataset.unit;document.querySelectorAll('[data-unit]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));update();}));
more.addEventListener('click',()=>{limit+=12;update(false);});
document.getElementById('clear-filters').addEventListener('click',()=>{search.value='';brand.value='';type.value='';sort.value='featured';update();search.focus();});
const dialog=document.getElementById('product-dialog');
const dollars=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
let currentSku=null,quoteRequest=0;
function openProduct(sku){
 const p=bySku.get(sku);if(!p)return;
 const image=document.getElementById('detail-image');image.dataset.fallback=p.thumbnail;image.src=p.image;image.alt=p.title;
 document.getElementById('detail-zoom').href=p.image;
 document.getElementById('detail-title').textContent=p.title;
 document.getElementById('detail-brand').textContent=p.brand;
 document.getElementById('detail-price').textContent=dollars.format(p.price)+' USD';
 document.getElementById('detail-sku').textContent=p.sku;
 document.getElementById('detail-type').textContent=p.productType;
 document.getElementById('detail-unit').textContent=p.sellingUnit;
 document.getElementById('detail-case').textContent=p.description;
 document.getElementById('detail-page').href=p.url;
 window.ElvarinsGallery.mount(dialog.querySelector('.detail-photo'),p);
 currentSku=sku; document.getElementById('shipping-qty').value=1; document.getElementById('shipping-zip').value=''; resetShipping();
 dialog.showModal();
}
document.querySelectorAll('[data-product]').forEach(b=>b.addEventListener('click',()=>openProduct(b.dataset.product)));
document.getElementById('detail-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.querySelectorAll('[data-close-dialog]').forEach(a=>a.addEventListener('click',()=>dialog.close()));
document.querySelectorAll('img[data-fallback]').forEach(img=>img.addEventListener('error',()=>{if(img.dataset.fallback){img.dataset.resolutionFallback='true';const fallback=img.dataset.fallback;delete img.dataset.fallback;img.src=fallback;}}));
const navtoggle=document.getElementById('navtoggle'),menu=document.getElementById('mobilemenu');
navtoggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;navtoggle.setAttribute('aria-expanded',String(!menu.hidden));});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;navtoggle.setAttribute('aria-expanded','false');}));
update();


function resetShipping(){
 quoteRequest++;const p=bySku.get(currentSku),q=Number(document.getElementById('shipping-qty').value);
 document.getElementById('item-subtotal').textContent=p&&Number.isInteger(q)&&q>=1&&q<=20?'Items subtotal: '+dollars.format(Math.round(p.price*100)*q/100)+' USD (shipping and tax additional)':'';
 document.getElementById('shipping-result').textContent='Shipping is confirmed before purchase. It is not included in the item price.';
 document.getElementById('shipping-submit').disabled=false;
}
document.getElementById('shipping-qty').addEventListener('input',resetShipping);
document.getElementById('shipping-zip').addEventListener('input',resetShipping);
document.getElementById('shipping-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!e.target.reportValidity())return;const id=++quoteRequest,button=document.getElementById('shipping-submit'),out=document.getElementById('shipping-result');button.disabled=true;out.textContent='Checking shipping…';
 try{const response=await fetch('/api/shipping/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sku:currentSku,quantity:Number(document.getElementById('shipping-qty').value),zip:document.getElementById('shipping-zip').value}),signal:AbortSignal.timeout(15000)});const data=await response.json();if(id!==quoteRequest)return;
 out.textContent=response.ok?data.rates.map(r=>r.carrier+' '+r.service+': '+dollars.format(r.amount)+' USD').join(' · ')+' — estimated shipping; taxes additional.':data.message||'Please request shipping details from our team before purchase.';
 }catch{if(id===quoteRequest)out.textContent='Shipping could not be checked. Please request shipping details from our team before purchase.';}finally{if(id===quoteRequest)button.disabled=false;}
});
