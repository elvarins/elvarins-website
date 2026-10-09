'use strict';
const product=JSON.parse(document.getElementById('product-data').textContent);const currentSku=product.sku;let quoteRequest=0;const dollars=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
function resetShipping(){
 quoteRequest++;const p=product,q=Number(document.getElementById('shipping-qty').value);
 document.getElementById('item-subtotal').textContent=p&&Number.isInteger(q)&&q>=1&&q<=20?'Items subtotal: '+dollars.format(Math.round(p.price*100)*q/100)+' USD (shipping and tax additional)':'';
 document.getElementById('shipping-result').textContent='Shipping is confirmed before purchase. It is not included in the item price.';
 document.getElementById('shipping-submit').disabled=false;
 if(p){const zip=document.getElementById('shipping-zip').value;const body='Hello Elvarins,\n\nItem: '+p.title+'\nSKU: '+p.sku+'\nUnit price: '+dollars.format(p.price)+' USD\nQuantity: '+q+'\nDelivery ZIP: '+zip+'\n\nPlease confirm availability, shipping and any applicable taxes before purchase.';document.getElementById('detail-inquiry').href='mailto:sales@elvarins.com?subject='+encodeURIComponent('Purchase inquiry — '+p.sku)+'&body='+encodeURIComponent(body);}
}
document.getElementById('shipping-qty').addEventListener('input',resetShipping);
document.getElementById('shipping-zip').addEventListener('input',resetShipping);
document.getElementById('shipping-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!e.target.reportValidity())return;const id=++quoteRequest,button=document.getElementById('shipping-submit'),out=document.getElementById('shipping-result');button.disabled=true;out.textContent='Checking shipping…';
 try{const response=await fetch('/api/shipping/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sku:currentSku,quantity:Number(document.getElementById('shipping-qty').value),zip:document.getElementById('shipping-zip').value}),signal:AbortSignal.timeout(15000)});const data=await response.json();if(id!==quoteRequest)return;
 out.textContent=response.ok?data.rates.map(r=>r.carrier+' '+r.service+': '+dollars.format(r.amount)+' USD').join(' · ')+' — estimated shipping; taxes additional.':data.message||'Please request shipping details from our team before purchase.';
 }catch{if(id===quoteRequest)out.textContent='Shipping could not be checked. Please request shipping details from our team before purchase.';}finally{if(id===quoteRequest)button.disabled=false;}
});

const navtoggle=document.getElementById('navtoggle'),menu=document.getElementById('mobilemenu');
navtoggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;navtoggle.setAttribute('aria-expanded',String(!menu.hidden));});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;navtoggle.setAttribute('aria-expanded','false');}));

resetShipping();
