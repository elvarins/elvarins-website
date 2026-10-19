import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {products,renderProduct} from '../product-pages.mjs';
const catalog=JSON.parse(await readFile(new URL('../catalog/products.json',import.meta.url),'utf8'));
assert.deepEqual(products,catalog.products,'Rendered catalog and public feed must agree');
assert.equal(new Set(products.map(p=>p.sku)).size,products.length,'Unique item numbers');
assert.equal(new Set(products.map(p=>p.url)).size,products.length,'Unique product routes');
let identifiers=0;
for(const p of products){
 assert.ok(p.price>0&&Number.isFinite(p.price),p.sku+' has a valid retail price');
 assert.ok(!p.manufacturerSku||p.manufacturerSku!==p.sku,p.sku+' supplier SKU must not be presented as a manufacturer part number');
 const page=renderProduct(p),schema=JSON.parse(page.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'][0];
 for(const [field,length] of [['gtin12',12],['gtin13',13]])if(p[field]){
  const value=p[field];assert.match(value,new RegExp('^[0-9]{'+length+'}$'),p.sku+' barcode length');
  const sum=[...value.slice(0,-1)].reverse().reduce((total,n,i)=>total+Number(n)*(i%2?1:3),0);
  assert.equal((10-sum%10)%10,Number(value.at(-1)),p.sku+' barcode checksum');
  assert.equal(schema[field],value,p.sku+' barcode schema');identifiers++;
 }
 assert.equal(schema.mpn,p.manufacturerSku,p.sku+' manufacturer identifier schema');
 if(p.contents)assert.ok(page.includes(p.contents.replaceAll('&','&amp;')),p.sku+' specific package contents visible');
 assert.ok(page.includes('<dt>Selling unit</dt>'),p.sku+' separates selling unit from included contents');
}
for(const c of catalog.collections)assert.equal(c.count,products.filter(p=>p.collection===c.slug).length,c.slug+' collection count');
console.log(`PASS: ${products.length} unique synchronized products, ${identifiers} valid barcodes, accurate manufacturer identifiers, package contents and collection counts`);
