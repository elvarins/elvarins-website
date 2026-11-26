import pilot from './template-pilot-products.json' with {type:'json'};
import { listBciProducts } from './bci-catalog.mjs';
import { listServiceProducts, isRetiredKitchenPath } from './service-pages.mjs';

export const collectionNames = {
  transformers:'Transformers', marvel:'Marvel', funko:'Funko Pop!', collectibles:'Collectibles',
  'pet-supplies':'Pet Supplies', 'pet-and-garden':'Pet & Garden', 'home-kitchen':'Home & Kitchen',
  'classroom-supplies':'Classroom Supplies', bci:'Pet & Garden Catalog'
};
export const departmentNames = {toys:'Toys & Collectibles', pets:'Pet Supplies', home:'Home & Kitchen'};

const clean = value => String(value ?? '').trim();
const text = value => clean(value).replace(/\b(?:Amazon|eBay|Walmart|authorized reseller|authorized retailer)\b/gi, '').replace(/\s{2,}/g,' ').trim();
const isImage = url => typeof url==='string' && /^(?:https:\/\/|\/(?:images|media)\/)/i.test(url);
export const normalizedSearch = value => clean(value).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

function normalize(row) {
  const url=row.url||'/products/'+row.slug;
  const slug=url.slice('/products/'.length);
  const id=clean(row.sku);
  const collection=row.collection||'collectibles';
  const department=row.department||(collection.startsWith('pet-')||collection==='bci'?'pets':collection==='home-kitchen'?'home':'toys');
  const existingSpecs=Object.fromEntries(Object.entries(row.specs||{}).map(([label,value])=>[text(label),text(value)]).filter(([label,value])=>label&&value));
  const images=[...new Set([...(row.images||[]),row.image].filter(isImage))].slice(0,8);
  const upc=[row.upc,row.gtin12,row.gtin13].map(clean).find(code=>/^(?:\d{12}|\d{13}|\d{14}|\d{8})$/.test(code));
  const size=text(row.size);
  const description=text(row.description);
  const brand=text(row.brand);
  const title=text(row.title);
  const category=text(row.category||row.productType)||collectionNames[collection]||'';
  const price=Number.isFinite(row.price)&&row.price>0?row.price:null;
  const related=pilot.find(p=>p.id===id);
  const record={
    id, slug, url, alias:row.alias, title, brand, department, collection, category, price,
    in_stock:price!==null&&row.inStock!==false, images, description, upc, size, mpn:clean(row.manufacturerSku),
    age_grade:text(row.age), warnings:[text(row.safetyNote)].filter(Boolean),
    includes:[text(row.contents)].filter(Boolean), dimensions:row.dimensions, weight:row.weight,
    specs:{type:text(row.productType),size,unit:text(row.sellingUnit),...existingSpecs},
    bullets:(row.bullets||[]).map(text).filter(point=>point.length>0&&point.length<150).slice(0,5),
    care:(row.care||[]).map(text).filter(Boolean), use:text(row.use), related_ids:[]
  };
  if(related&&!row.edited){
    Object.assign(record,{title:related.title,description:related.description,bullets:related.bullets,
      includes:related.includes,mpn:related.mpn,specs:{...record.specs,...related.specs},meta_description:related.meta_description});
  }
  record.meta_description ||= (description || [title,brand&&'by '+brand,category].filter(Boolean).join(' · ')).slice(0,158);
  record.search=[title,record.title,brand,category,collection,department,id,upc,record.mpn,size,row.sourceTitle]
    .filter(Boolean).map(normalizedSearch);
  return record;
}

const services=listServiceProducts().map(normalize);
const supplier=listBciProducts().map(normalize);
for (const product of services) {
  if (product.collection!=='home-kitchen' || !product.upc) continue;
  product.images = product.images.map((source,index)=>{
    if (new URL(source,'https://elvarins.com').hostname!=='thebazaarinc.com') return source;
    return '/media/kitchen/'+product.upc+'-'+(index+1)+'.jpg';
  });
}

const servicePaths=new Set(services.map(product=>product.url));
const aliases=new Map(supplier.filter(product=>servicePaths.has(product.alias)).map(product=>[product.url,product.alias]));

export function storefrontCatalog(managed) {
  const hidden=new Set([...managed.values()].filter(row=>!row.published).map(row=>row.sku));
  const managedProducts=[...managed.values()].filter(row=>row.published&&!isRetiredKitchenPath(row.url)).map(normalize);
  const byPath=new Map();
  for (const product of [...managedProducts,...services,...supplier]) {
    if(hidden.has(product.id)||byPath.has(product.url)||aliases.has(product.url))continue;
    byPath.set(product.url,product);
  }
  const hiddenPaths=new Set();
  for (const [path,product] of byPath) {
    if (product.price!==null) continue;
    hiddenPaths.add(path);
    byPath.delete(path);
  }
  const visibleAliases=new Map(aliases);
  for (const [path,destination] of visibleAliases) {
    if (!hiddenPaths.has(destination)) continue;
    hiddenPaths.add(path);
    visibleAliases.delete(path);
  }
  return {items:[...byPath.values()],byPath,aliases:visibleAliases,hiddenPaths};
}

export function matchesSearch(product,query) {
  const terms=normalizedSearch(query).split(' ').filter(Boolean);
  if(!terms.length)return !clean(query);
  const words=product.search.flatMap(field=>field.split(' '));
  const compact=product.search.map(field=>field.replaceAll(' ',''));
  const queryCompact=terms.join('');
  return terms.every(term=>words.some(word=>word.startsWith(term))||compact.some(field=>field.includes(term)))||
    compact.some(field=>field.includes(queryCompact));
}

export function inCollection(product,collection) {
  return !collection||product.collection===collection||
    (collection==='pet-supplies'&&product.collection==='pet-and-garden')||
    (collection==='pet-and-garden'&&product.collection==='bci'&&product.images.length>0);
}
