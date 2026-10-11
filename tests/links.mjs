// Check public navigation targets and fragments against the actual Worker output.
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const {Miniflare,convertV4MiniflareOptions}=await import(process.env.ELVARINS_TEST_MINIFLARE||'miniflare');
const root=fileURLToPath(new URL('../',import.meta.url));
const options={modules:['worker.mjs','shipping.mjs','product-pages.mjs','customer-ui.mjs','customer-api.mjs','service-pages.mjs'].map(path=>({type:'ESModule',path:root+path})),compatibilityDate:'2026-10-06',compatibilityFlags:['nodejs_compat']};
const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);
const origin='https://elvarins.com',cache=new Map(),targets=new Set();
async function get(path){if(!cache.has(path)){const r=await mf.dispatchFetch(origin+path);cache.set(path,{status:r.status,body:await r.text()});}return cache.get(path);}
try{
 const sitemap=await get('/sitemap.xml');
 const routes=[...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
 for(const path of routes){const page=await get(path);assert.equal(page.status,200,path);for(const m of page.body.matchAll(/(?:href|src)="([^"<>]+)"/g)){const value=m[1].replaceAll('&amp;','&');if(!value||/^(mailto:|tel:|data:)/.test(value))continue;const u=new URL(value,origin+path);if(u.origin===origin)targets.add(u.pathname+u.hash);}}
 const broken=[];
 for(const target of targets){const u=new URL(target,origin),page=await get(u.pathname);if(page.status!==200){broken.push(target+' HTTP '+page.status);continue;}if(u.hash&&!page.body.includes('id="'+decodeURIComponent(u.hash.slice(1))+'"'))broken.push(target+' missing fragment');}
 assert.deepEqual(broken,[],'Broken internal navigation or asset targets');
 console.log(`PASS: ${routes.length} sitemap pages and ${targets.size} internal link, asset and fragment targets`);
}finally{await mf.dispose();}
