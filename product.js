'use strict';
const navtoggle=document.getElementById('navtoggle'),menu=document.getElementById('mobilemenu');
navtoggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;navtoggle.setAttribute('aria-expanded',String(!menu.hidden));});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;navtoggle.setAttribute('aria-expanded','false');}));

