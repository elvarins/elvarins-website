import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {JSDOM}=await import(process.env.ELVARINS_TEST_JSDOM||'jsdom');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const gallery=await readFile(new URL('../gallery.js',import.meta.url),'utf8');
const catalog=await readFile(new URL('../catalog.js',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://elvarins.com',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;};
try{
 w.eval(gallery);w.eval(catalog);
 w.document.querySelector('[data-product="JK433524"]').click();
 assert.equal(w.document.querySelector('#product-dialog').open,true);
 assert.equal(w.document.querySelector('#detail-gallery').getAttribute('role'),'region');
 assert.equal(w.document.querySelector('#detail-gallery').getAttribute('aria-label'),'Product photo gallery for Homer “The Chosen One” — The Simpsons 5-Inch Figure');
 assert.equal(w.document.querySelector('#detail-inquiry').getAttribute('aria-describedby'),'quickview-purchase-note');
 assert.match(w.document.querySelector('#quickview-purchase-note').textContent,/does not place an order/);
 assert.equal(w.document.querySelector('#detail-unit').textContent,'One retail item');
 assert.equal(w.document.querySelector('#detail-contents').textContent,'1 Homer figure, removable hat and stein');
 assert.equal(w.document.querySelector('#detail-contents').hidden,false);
 assert.equal(w.document.querySelector('#detail-contents-label').hidden,false);
 w.document.querySelector('[data-product="GN52132"]').click();
 assert.equal(w.document.querySelector('#detail-unit').textContent,'One retail item');
 assert.equal(w.document.querySelector('#detail-contents').textContent,'');
 assert.equal(w.document.querySelector('#detail-contents').hidden,true);
 assert.equal(w.document.querySelector('#detail-contents-label').hidden,true);
 assert.match(html,/catalog\.js\?v=quickview-accessibility-20261110/);
 console.log('PASS: quick view has an accessible product gallery and purchase-process context, separates selling unit from verified package contents and hides unavailable contents');
}finally{w.close();}
