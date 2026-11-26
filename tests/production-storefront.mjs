// Smoke-test the exact production entrypoint declared in wrangler.jsonc.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {Miniflare,convertV4MiniflareOptions}=await import(process.env.ELVARINS_TEST_MINIFLARE||'miniflare');
const root=fileURLToPath(new URL('../',import.meta.url));
const modulePaths=[
 'store-worker.mjs','worker.mjs','shipping.mjs','shipping-offer.mjs','product-pages.mjs','product-presentation.mjs',
 'customer-ui.mjs','customer-api.mjs','fulfillment-portal.mjs','service-pages.mjs','supplier-storefront.mjs',
 'inquiry-notifications.mjs','checkout-api.mjs','bci-catalog.mjs','store-management.mjs','store-extensions.mjs',
 'store-labels.mjs','storefront-refresh.mjs','storefront-header.mjs','storefront-catalog.mjs','offer-polish.mjs',
 'template-pilot.mjs','template-pilot-assets.mjs','catalog/bci-inventory-1.mjs',
 'catalog/bci-inventory-2.mjs','catalog/bci-inventory-3.mjs'
];
// The local workerd version predates JSON import attributes. Keep the production
// sources intact while shimming only that syntax in this local smoke test.
const modules=await Promise.all(modulePaths.map(async path=>{
 let contents=await readFile(root+path,'utf8');
 if(path==='template-pilot.mjs'||path==='storefront-catalog.mjs')contents=contents.replace(/\s+with\s*\{\s*type:\s*['"]json['"]\s*\}/g,'');
 return {type:'ESModule',path:root+path,contents};
}));
modules.push({type:'ESModule',path:root+'template-pilot-products.json',contents:'export default '+await readFile(root+'template-pilot-products.json','utf8')});
const options={modules,compatibilityDate:process.env.ELVARINS_TEST_COMPAT_DATE||'2026-10-06',compatibilityFlags:['nodejs_compat'],d1Databases:['CUSTOMER_DB']};
const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);
const origin='https://elvarins.com';
try{
 const db=await mf.getD1Database('CUSTOMER_DB');
 for(const file of ['store-management.sql','store-extensions.sql']){
  for(const sql of (await readFile(root+file,'utf8')).split(';').map(x=>x.trim()).filter(Boolean))await db.prepare(sql).run();
 }
 const home=await mf.dispatchFetch(origin+'/');
 assert.equal(home.status,200);
 const html=await home.text();
 assert.match(html,/data-elv-refresh="home"/);
 assert.match(html,/Free shipping <span>at \$149\+<\/span>/);
 assert.match(html,/shipping-offer-v1\.jpg/);
 assert.equal((html.match(/id="shipping-promo-dialog"/g)||[]).length,1);
 assert.doesNotMatch(html,/Sold by Elvarins/i);
 assert.match(html,/30 N Gould St STE R/);
 assert.doesNotMatch(html,/Registered business address/i);
 assert.match(html,/Availability confirmed before purchase/);
 assert.doesNotMatch(html,/>\s*In Stock\s*</i);

 const contact=await mf.dispatchFetch(origin+'/contact');
 assert.equal(contact.status,200);
 const contactHtml=await contact.text();
 assert.match(contactHtml,/<strong>Business correspondence<\/strong><br>30 N Gould St STE R/);
 assert.doesNotMatch(contactHtml,/Registered business address/i);

 const productPath='/products/transformers-age-of-the-primes-voyager-nexus-prime-hsg2001';
 const product=await mf.dispatchFetch(origin+productPath);
 assert.equal(product.status,200);
 const productHtml=await product.text();
 assert.match(productHtml,/class="pilot-product"/);
 assert.match(productHtml,/data-in-stock="true">Availability confirmed before purchase/);
 assert.doesNotMatch(productHtml,/schema\.org\/InStock|>\s*In Stock\s*</i);
 assert.match(productHtml,/>\$54\.90</);
 assert.doesNotMatch(productHtml,/Sold by Elvarins/i);
 assert.match(productHtml,/data-elv-cart-add="HSG2001"/);

 const bci=await mf.dispatchFetch(origin+'/products/bci-000116043601');
 assert.equal(bci.status,200);
 const bciHtml=await bci.text();
 assert.match(bciHtml,/Availability confirmed before purchase/);
 assert.match(bciHtml,/Free standard U\.S\. shipping on orders of \$149\+/);
 assert.doesNotMatch(bciHtml,/>\s*In Stock\s*<|orders over \$49/i);

 const cart=await (await mf.dispatchFetch(origin+'/cart.js')).text();
 assert.match(cart,/FREE_SHIPPING_CENTS=14900/);
 assert.match(cart,/Online payment is not available yet/);
 assert.doesNotMatch(cart,/\ninitProductReviews\(\);\n/);
 assert.match(cart,/className='elv-cart-item-title'/);
 assert.match(cart,/title.href=p.url/);
 const css=await (await mf.dispatchFetch(origin+'/storefront-compact.css')).text();
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/data-stock-state="in"/);

 const photo=await mf.dispatchFetch(origin+'/media/storefront/shipping-offer-v1.jpg');
 assert.equal(photo.status,200);
 assert.equal(photo.headers.get('Content-Type'),'image/jpeg');
 assert.ok((await photo.arrayBuffer()).byteLength>10000);

 const kitchen=await mf.dispatchFetch(origin+'/collections/home-kitchen');
 assert.equal(kitchen.status,200);
 const kitchenHtml=await kitchen.text();
 assert.match(kitchenHtml,/\/media\/kitchen\/843018113436-1\.jpg/);
 assert.doesNotMatch(kitchenHtml,/Request this item/);
 const hiddenPath='/products/bees-wrap-reusable-food-wraps-wheels-n-wedges-3-pack';
 const hiddenProduct=await mf.dispatchFetch(origin+hiddenPath);
 assert.equal(hiddenProduct.status,404);
 assert.doesNotMatch(await (await mf.dispatchFetch(origin+'/sitemap.xml')).text(),new RegExp(hiddenPath));

 const state=await (await mf.dispatchFetch(origin+'/api/checkout')).json();
 assert.equal(state.available,false);
 assert.equal(state.freeShippingThresholdCents,14900);
 console.log('PASS: production storefront entrypoint, offer, product buy box, motion guard and checkout threshold');
}finally{await mf.dispose();}
