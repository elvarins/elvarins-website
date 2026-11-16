'use strict';
const product=JSON.parse(document.getElementById('product-data').textContent);const dollars=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
function resetShipping(){
 const p=product,q=Number(document.getElementById('shipping-qty').value);
 document.getElementById('item-subtotal').textContent=p&&Number.isInteger(q)&&q>=1&&q<=20?'Items subtotal: '+dollars.format(Math.round(p.price*100)*q/100)+' USD (shipping and tax additional)':'';
}
document.getElementById('shipping-qty').addEventListener('input',resetShipping);

const navtoggle=document.getElementById('navtoggle'),menu=document.getElementById('mobilemenu');
navtoggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;navtoggle.setAttribute('aria-expanded',String(!menu.hidden));});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;navtoggle.setAttribute('aria-expanded','false');}));

resetShipping();
