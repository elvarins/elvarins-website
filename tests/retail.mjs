// Run with Node 22+ and miniflare installed. Set ELVARINS_TEST_MINIFLARE to an absolute package entry if needed.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {Miniflare,convertV4MiniflareOptions}=await import(process.env.ELVARINS_TEST_MINIFLARE||'miniflare');
const root=fileURLToPath(new URL('../',import.meta.url));
const options={modules:['worker.mjs','shipping.mjs','product-pages.mjs','customer-ui.mjs','customer-api.mjs','service-pages.mjs'].map(path=>({type:'ESModule',path:root+path})),compatibilityDate:'2026-10-06',compatibilityFlags:['nodejs_compat'],d1Databases:['CUSTOMER_DB']};
const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);
const origin='https://elvarins.com';
let checks=0;
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
const req=async(path,data,session,extra={})=>{const r=await mf.dispatchFetch(origin+path,{method:data===undefined?'GET':'POST',headers:{Origin:origin,...(data===undefined?{}:{'Content-Type':'application/json'}),...(session?{Cookie:session}:{}),...extra},...(data!==undefined?{body:JSON.stringify(data)}:{})});return {r,data:await r.json(),cookie:r.headers.get('Set-Cookie')?.split(';')[0]};};
try{
 const db=await mf.getD1Database('CUSTOMER_DB');await db.exec(await readFile(root+'customer-schema.sql','utf8'));
 const catalog=JSON.parse(await readFile(root+'catalog/products.json','utf8'));
 const home=await mf.dispatchFetch(origin);check(home.status===200,'Homepage returns 200');const html=await home.text();
 check(!html.includes('Supplier &amp; business inquiries'),'Supplier inquiry is removed');check(html.includes('data-open-account'),'Account controls are present');check(html.includes('question-form'),'Customer form is present');check(html.includes('Do Not Sell or Share'),'Privacy choices are present');
 const homeSchema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
 const listed=homeSchema['@graph'].find(x=>x['@type']==='ItemList').itemListElement;
 check(listed.length===catalog.products.length&&listed.every((x,i)=>x.url===origin+catalog.products[i].url),'Homepage schema covers the full current catalog');
 const sitemap=await (await mf.dispatchFetch(origin+'/sitemap.xml')).text();
 check(catalog.products.every(p=>sitemap.includes('<loc>'+origin+p.url+'</loc>')),'All product routes are in the sitemap');
 check(html.includes('id="reset-catalog-filters"'),'Search can be cleared while matches remain');
 for(const path of ['index.html','catalog.js','catalog/products.json']){const served=await (await mf.dispatchFetch(origin+'/'+(path==='index.html'?'':path))).text();check(served===await readFile(root+path,'utf8'),'Worker asset matches source '+path);}
 for(const p of catalog.products){const r=await mf.dispatchFetch(origin+p.url);check(r.status===200,'Product '+p.sku+' returns 200');const h=await r.text();check(h.includes('customer-ui')===false&&h.includes('id="question-dialog"'),'Question form renders on '+p.sku);check(h.includes('id="detail-inquiry" class="btn btn-primary" type="button"'),'Product inquiry uses working form');const schema=JSON.parse(h.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);check(schema['@graph'][0].sku===p.sku,'Correct product schema');check(!schema['@graph'][0].offers&&!schema['@graph'][0].aggregateRating,'No fake checkout or reviews');}
 for(const c of catalog.collections){const r=await mf.dispatchFetch(origin+'/collections/'+c.slug);check(r.status===200,'Collection '+c.slug);const h=await r.text(),subset=JSON.parse(h.match(/<script id="catalog-data" type="application\/json">(.*?)<\/script>/s)[1]);check(subset.every(p=>p.collection===c.slug),'Collection has matching products');check(!h.includes('collection-showcase'),'Collection hero remains focused');}
 for(const c of catalog.collections){const h=await (await mf.dispatchFetch(origin+'/collections/'+c.slug)).text();const subset=catalog.products.filter(p=>p.collection===c.slug);for(const [id,field] of [['brand-filter','brand'],['type-filter','productType']]){const select=h.match(new RegExp('<select[^>]+id="'+id+'"[^>]*>([\\s\\S]*?)</select>'))[1];const options=[...select.matchAll(/<option>(.*?)<\/option>/g)].map(x=>x[1].replaceAll('&amp;','&'));check(options.length===new Set(subset.map(p=>p[field])).size&&options.every(x=>subset.some(p=>p[field]===x)),'Collection facets match '+c.slug+' '+field);}}
 check((await mf.dispatchFetch(origin+'/products/does-not-exist')).status===404,'Unknown product 404');check((await mf.dispatchFetch(origin+'/customer-api.mjs')).status===404,'Server module not exposed');check((await mf.dispatchFetch(origin+'/catalog/health-household-drafts.json')).status===404,'Pending batch remains unpublished');
 let a=await req('/api/account/me');check(a.data.user===null,'Signed-out session is anonymous');
 a=await req('/api/account/signup',{email:'qa-one@example.test',name:'QA One',password:'not-short-but'});check(a.r.status===400,'Short password rejected');
 a=await req('/api/account/signup',{email:'qa-one@example.test',name:'QA One',password:'Long QA password 84725!'},null,{Origin:'https://evil.example'});check(a.r.status===403,'Cross-origin signup rejected');
 a=await req('/api/account/signup',{email:'qa-one@example.test',name:'QA One',password:'Long QA password 84725!'});check(a.r.status===201,'Signup works in native Worker runtime');check(a.data.recoveryCode.length===64,'Recovery code is strong');check(/HttpOnly.*SameSite=Strict/.test(a.r.headers.get('Set-Cookie')),'Session cookie is HttpOnly and SameSite Strict');let session=a.cookie,code=a.data.recoveryCode;
 const stored=await db.prepare('SELECT password_hash,recovery_hash FROM customers WHERE email=?').bind('qa-one@example.test').first();check(stored.password_hash.startsWith('scrypt-v1$')&&!stored.password_hash.includes('password'),'Password is stored as scrypt hash');check(stored.recovery_hash!==code,'Recovery code is hashed');
 a=await req('/api/account/me',undefined,session);check(a.data.user.name==='QA One','Session restores account');
 a=await req('/api/account/favorite',{sku:catalog.products[0].sku,saved:true},session);check(a.r.status===200,'Favorite saved');
 a=await req('/api/account/me',undefined,session);check(a.data.favorites.includes(catalog.products[0].sku),'Favorite persists across requests');
 a=await req('/api/account/favorite',{sku:'FAKE-SKU',saved:true},session);check(a.r.status===400,'Unknown favorite rejected');
 a=await req('/api/account/logout',{},session);check(a.r.status===200,'Logout works');a=await req('/api/account/me',undefined,session);check(a.data.user===null,'Old cookie is invalidated');
 a=await req('/api/account/login',{email:'qa-one@example.test',password:'Wrong long password 123'});check(a.r.status===401,'Wrong password rejected');
 a=await req('/api/account/login',{email:'qa-one@example.test',password:'Long QA password 84725!'});check(a.r.status===200,'Login works');session=a.cookie;
 a=await req('/api/account/recover',{email:'qa-one@example.test',password:'New QA password 67892!',recoveryCode:code});check(a.r.status===200,'Recovery works');const newCode=a.data.recoveryCode;check(newCode!==code,'Recovery code rotates');
 a=await req('/api/account/me',undefined,session);check(a.data.user===null,'Recovery revokes prior sessions');
 a=await req('/api/account/recover',{email:'qa-one@example.test',password:'New QA password 67892!',recoveryCode:code});check(a.r.status===401,'Used recovery code rejected');
 a=await req('/api/inquiries',{name:'QA Test',email:'support@example.test',topic:'product',sku:catalog.products[0].sku,message:'Test request. Is this the original retail package?',website:''});check(a.r.status===201,'Product inquiry stored');check((await db.prepare('SELECT message FROM inquiries WHERE id=?').bind(a.data.reference).first()).message.startsWith('Test request'),'Received reference points to stored request');
 a=await req('/api/inquiries',{name:'QA Test',email:'support@example.test',topic:'privacy',message:'Please provide details about my privacy request.',website:''});check(a.r.status===201,'Privacy request stored');
 a=await req('/api/inquiries',{name:'QA Test',email:'support@example.test',topic:'product',sku:'FAKE',message:'A long enough invalid request.',website:''});check(a.r.status===400,'Invalid product question rejected');
 a=await req('/api/inquiries',{name:'QA Test',email:'support@example.test',topic:'product',message:'A long enough bot request.',website:'spam'});check(a.r.status===400,'Honeypot rejected');
 // Separate IP prevents unrelated global bucket from masking the email throttle.
 for(let i=0;i<6;i++){a=await req('/api/account/login',{email:'limited@example.test',password:'Wrong long password 123'},null,{'CF-Connecting-IP':'192.0.2.55'});}check(a.r.status===429,'Persistent auth throttling works');

 for(const path of ['/about','/privacy-policy','/terms-of-sale','/terms-of-use','/accessibility','/privacy-choices','/shipping-delivery','/returns','/help-center','/track-order','/safety-recalls','/coupons','/newsletter','/blog','/blog/choosing-a-collectible','/blog/understanding-retail-prices','/blog/using-your-saved-collection']){const r=await mf.dispatchFetch(origin+path),body=await r.text();check(r.status===200,'Information page '+path);check(body.includes('newsletter-form')&&body.includes('question-dialog'),'Shared forms on '+path);}
 check(!html.includes('id="about"')&&!html.includes('id="privacy"')&&!html.includes('id="policies"'),'Full information moved off homepage');
 a=await req('/api/newsletter',{email:'news@example.test',action:'subscribe',consent:false});check(a.r.status===400,'Newsletter requires consent');
 a=await req('/api/newsletter',{email:'news@example.test',action:'subscribe',consent:true});check(a.r.status===200,'Newsletter subscribes');check((await db.prepare('SELECT subscribed,consented_at FROM newsletter_subscribers WHERE email=?').bind('news@example.test').first()).subscribed===1,'Subscription persisted');
 a=await req('/api/newsletter',{email:'news@example.test',action:'unsubscribe'});check(a.r.status===200,'Unsubscribe works');check((await db.prepare('SELECT subscribed FROM newsletter_subscribers WHERE email=?').bind('news@example.test').first()).subscribed===0,'Suppression persisted');
 a=await req('/api/newsletter',{email:'bot@example.test',action:'subscribe',consent:true,website:'spam'});check(a.r.status===400,'Newsletter honeypot rejected');
 a=await req('/api/newsletter',{email:'origin@example.test',action:'subscribe',consent:true},null,{Origin:'https://example.test'});check(a.r.status===403,'Newsletter CSRF protection');
 const head=await mf.dispatchFetch(origin,{method:'HEAD'});check((await head.text())==='','HEAD returns no body');
 console.log(JSON.stringify({status:'PASS',checks,productPages:catalog.products.length,collections:catalog.collections.length,auth:'signup/login/logout/recovery/favorites',forms:'product/privacy/validation/rate limits'}));
}finally{await mf.dispose();}
