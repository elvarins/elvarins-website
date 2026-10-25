import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {JSDOM}=await import(process.env.ELVARINS_TEST_JSDOM||'jsdom');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const script=await readFile(new URL('../retail.js',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://elvarins.com',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
let welcomeTimer;
w.matchMedia=()=>({matches:true});
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
w.fetch=async()=>({ok:true,json:async()=>({user:null,favorites:[]})});
w.AbortSignal.timeout=()=>undefined;
const realTimeout=w.setTimeout.bind(w);
w.setTimeout=(fn,ms,...args)=>ms===850?(welcomeTimer=fn,1):realTimeout(fn,ms,...args);
try{
 w.eval(script);
 const popup=w.document.querySelector('#offers-dialog');
 assert.ok(welcomeTimer);assert.equal(popup.open,false);
 welcomeTimer();assert.equal(popup.open,true);
 assert.equal(w.sessionStorage.getItem('elvarins-offers-20261026'),'shown');
 popup.querySelector('[aria-label="Close offers"]').click();assert.equal(popup.open,false);
 welcomeTimer();assert.equal(popup.open,false,'Does not reopen within the same session');
 popup.querySelector('[data-offer-code="SAVE10"]').click();
 assert.equal(w.document.querySelector('#question-dialog').open,true);
 assert.ok(w.document.querySelector('#question-message').value.includes('SAVE10'));
 assert.ok(w.document.querySelector('#question-message').value.includes('final quote'));
 const draft=w.document.querySelector('#question-form a[href^="mailto:"]');
 assert.ok(new URL(draft.href).searchParams.get('body').includes('SAVE10'));
 assert.equal(popup.querySelectorAll('.offer-card').length,3);
 w.sessionStorage.removeItem('elvarins-offers-20261026');
 w.document.querySelector('#question-dialog').close();
 w.document.querySelector('#account-dialog').showModal();welcomeTimer();
 assert.equal(popup.open,false,'Does not replace an active form');
 w.document.querySelector('#account-dialog').close();
 w.document.querySelector('#site-search')?.focus(); // Some pages use a different search ID.
 const input=w.document.querySelector('input');input.focus();welcomeTimer();
 assert.equal(popup.open,false,'Does not interrupt typing');
 console.log('PASS: welcome display, close control, session frequency, active-form protection, offer inquiry and email draft');
}finally{w.close();}
