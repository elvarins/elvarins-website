import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {JSDOM}=await import(process.env.ELVARINS_TEST_JSDOM||'jsdom');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const script=await readFile(new URL('../retail.js',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://elvarins.com',runScripts:'outside-only'}),w=dom.window;
w.matchMedia=()=>({matches:false});w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
let fail=false,submissions=0;
w.fetch=async(path)=>{if(path==='/api/inquiries'){submissions++;if(fail)throw Error('offline');return {ok:true,json:async()=>({message:'Request received.',reference:'test-reference-123'})};}return {ok:true,json:async()=>({user:null,favorites:[]})};};
w.AbortSignal.timeout=()=>undefined;
try{
 w.eval(script);
 const form=w.document.querySelector('#question-form'),status=w.document.querySelector('#question-status');
 const fields={name:'Test Customer',email:'test@example.test',sku:'HSG2001',message:'Can you confirm this item? <script> & # +',topic:'product'};
 for(const [key,value] of Object.entries(fields))form.elements[key].value=value;
 form.dispatchEvent(new w.Event('input',{bubbles:true}));
 const link=form.querySelector('a[href^="mailto:"]'),url=new URL(link.href);
 assert.equal(url.pathname,'sales@elvarins.com');assert.ok(url.searchParams.get('body').includes(fields.message));assert.ok(url.searchParams.get('subject').includes(fields.sku));assert.equal(submissions,0);
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(setImmediate);
 assert.equal(submissions,1);assert.ok(status.textContent.includes('test-reference-123'));assert.ok(status.textContent.includes('not an order confirmation'));assert.ok(new URL(link.href).searchParams.get('body').includes(fields.message));assert.ok(new URL(link.href).searchParams.get('subject').includes('test-reference-123'));assert.equal(form.elements.message.value,'');
 for(const [key,value] of Object.entries(fields))form.elements[key].value=value;
 form.dispatchEvent(new w.Event('input'));assert.ok(!link.href.includes('test-reference-123'));
 fail=true;form.dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(setImmediate);
 assert.equal(form.elements.message.value,fields.message);assert.ok(status.textContent.includes('could not confirm'));assert.equal(form.querySelector('[type="submit"]').disabled,false);assert.ok(new URL(link.href).searchParams.get('body').includes(fields.message));
 console.log('PASS: inquiry draft encoding, no automatic send, success reference, no order claim, stale-reference reset, failure recovery');
}finally{w.close();}
