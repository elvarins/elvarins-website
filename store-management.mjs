import { timingSafeEqual } from 'node:crypto';

export const adminPath = '/api/account/admin/manage';
export const collections = ['transformers','marvel','funko','collectibles','pet-supplies'];
export const editablePages = ['/','/about','/contact','/brand-partners','/shipping-delivery','/returns','/terms-of-sale'];
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export const safeJson = value => JSON.stringify(value).replace(/</g,'\\u003c');
const validKey = key => /^[a-f0-9]{64}$/.test(key || '');
const headers = {
  'Cache-Control':'private, no-store','Content-Type':'text/html; charset=utf-8',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow',
  'X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};
const reply = (body, status=200, extra={}) => new Response(body,{status,headers:{...headers,...extra}});
const fields = [['title','Product name',180],['brand','Brand',100],['productType','Product type',100],['size','Size',120],['age','Manufacturer age guidance',100],['manufacturerSku','Manufacturer item number',80],['contents','Package contents',500],['safetyNote','Safety information',1400]];

function auth(request, env) {
  const key = env.OWNER_DASHBOARD_KEY;
  if (!validKey(key) || key === env.FULFILLMENT_PORTAL_KEY) return 503;
  const auth = request.headers.get('Authorization') || '';
  try {
    if (!auth.startsWith('Basic ') || auth.length > 512) return 401;
    const expected = Buffer.from('owner:' + key);
    const supplied = Buffer.from(atob(auth.slice(6)));
    return supplied.length === expected.length && timingSafeEqual(supplied,expected) ? 200 : 401;
  } catch { return 401; }
}

export function mergeCatalog(base, rows) {
  const map = new Map(base.map(p => [p.sku, {...p,published:true,inStock:true}]));
  for (const row of rows) {
    map.set(row.sku,{...map.get(row.sku),...JSON.parse(row.data),sku:row.sku,
      slug:row.slug,url:'/products/'+row.slug,published:row.published===1,inStock:row.in_stock===1,revision:row.revision,edited:true});
  }
  return map;
}

async function formData(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded') || request.headers.get('Origin') !== new URL(request.url).origin) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let bytes=0, body='';
  try {
    while (true) {
      const {value,done}=await reader.read();
      if (done) break;
      bytes+=value.byteLength;
      if(bytes>24000){await reader.cancel();return null;}
      body+=decoder.decode(value,{stream:true});
    }
    return new URLSearchParams(body+decoder.decode());
  } finally {reader.releaseLock();}
}

const productSku = /^[A-Za-z0-9][A-Za-z0-9_-]{0,47}$/;
const productSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const revisionValid = n => /^(?:0|[1-9]\d{0,8})$/.test(n || '');
const read = (form,key) => form.get(key)?.trim() || '';
const imageUrl = value => {
  try {
    const u=new URL(value);
    return u.protocol==='https:' && !u.username && !u.password && !u.hash && value.length<=1000;
  } catch {return false;}
};
const barcodeValid = value => !value || (/^\d{12,13}$/.test(value) &&
  [...value].reverse().reduce((sum,digit,i)=>sum+Number(digit)*(i%2?3:1),0)%10===0);

async function updateProduct(db,form,base,lookupLegacy) {
  const sku=read(form,'sku'), slug=read(form,'slug'), revision=read(form,'revision');
  const collection=read(form,'collection'), price=read(form,'price'), description=read(form,'description');
  const images=[...new Set(read(form,'images').split(/\r?\n/).map(v=>v.trim()).filter(Boolean))];
  const data=Object.fromEntries(fields.map(([key])=>[key,read(form,key)]));
  const barcode=read(form,'barcode');
  const published=Number(form.get('published')==='1'), inStock=Number(form.get('inStock')==='1');
  if (!productSku.test(sku)||!productSlug.test(slug)||slug.length>140||!revisionValid(revision)
      ||!collections.includes(collection)||!/^\d{1,5}(?:\.\d{1,2})?$/.test(price)||Number(price)<=0||Number(price)>10000
      ||!data.title||!data.brand||!data.productType||!description||description.length>6000||!images.length
      ||images.length>8||images.some(x=>!imageUrl(x))||fields.some(([key,,max])=>data[key].length>max)||!barcodeValid(barcode)) {
    return 'Check title, brand, price, collection, photo URLs and product specifications.';
  }
  const original=base.find(p=>p.sku===sku)||lookupLegacy(sku);
  const legacySlug=lookupLegacy(slug.startsWith('bci-')?slug:'page-'+slug);
  if ((original && original.slug!==slug)||base.some(p=>p.slug===slug&&p.sku!==sku)||
    (legacySlug&&legacySlug.sku!==sku))return 'SKU or product URL is already reserved.';
  Object.assign(data,{collection,price:Number(price),description,images,image:images[0],thumbnail:images[0],gtin12:barcode.length===12?barcode:'',gtin13:barcode.length===13?barcode:''});
  try {
    const result=revision==='0'
      ? await db.prepare('INSERT INTO storefront_products(sku,slug,data,published,in_stock) VALUES(?,?,?,?,?) ON CONFLICT(sku) DO NOTHING').bind(sku,slug,JSON.stringify(data),published,inStock).run()
      : await db.prepare('UPDATE storefront_products SET data=?,published=?,in_stock=?,revision=revision+1 WHERE sku=? AND slug=? AND revision=?').bind(JSON.stringify(data),published,inStock,sku,slug,Number(revision)).run();
    if(!result.meta.changes)return 'This product changed in another tab. Reload before editing again.';
  } catch(error){
    if(/UNIQUE constraint/i.test(String(error)))return 'This product URL belongs to another product.';
    throw error;
  }
  return null;
}

async function updateCopy(db,form) {
  const path=read(form,'path'),heading=read(form,'heading'),body=read(form,'body'),rev=read(form,'revision');
  if(!editablePages.includes(path)||!heading||heading.length>180||!body||body.length>6000||!revisionValid(rev))return 'Enter a valid page, heading and copy.';
  const result=rev==='0'
    ? await db.prepare('INSERT INTO storefront_copy(path,heading,body) VALUES(?,?,?) ON CONFLICT(path) DO NOTHING').bind(path,heading,body).run()
    : await db.prepare('UPDATE storefront_copy SET heading=?,body=?,revision=revision+1 WHERE path=? AND revision=?').bind(heading,body,path,Number(rev)).run();
  return result.meta.changes?null:'Another edit was saved first. Reload before editing again.';
}

async function updateTracking(db,form) {
  const id=read(form,'orderId'),carrier=read(form,'carrier'),tracking=read(form,'tracking');
  if(!/^[a-f0-9-]{36}$/.test(id)||!/^[\w .&()-]{2,40}$/.test(carrier)||!/^[A-Za-z0-9][A-Za-z0-9 -]{3,79}$/.test(tracking))return 'Enter a carrier and valid tracking number.';
  const result=await db.prepare("INSERT INTO shipment_tracking(order_id,carrier,tracking,updated_at) SELECT id,?,?,? FROM checkout_orders WHERE id=? AND status='paid' AND stripe_session_id GLOB 'cs_live_*' ON CONFLICT(order_id) DO UPDATE SET carrier=excluded.carrier,tracking=excluded.tracking,updated_at=excluded.updated_at").bind(carrier,tracking,Date.now(),id).run();
  return result.meta.changes?null:'Only a paid live order can receive tracking.';
}

const inp=(name,label,value,max,type='text')=>'<label>'+escape(label)+'<input type="'+type+'" name="'+escape(name)+'" value="'+escape(value)+'" maxlength="'+max+'"></label>';
const hidden=(name,value)=>'<input type="hidden" name="'+escape(name)+'" value="'+escape(value)+'">';
const area=(name,label,value,max)=>'<label>'+escape(label)+'<textarea name="'+name+'" maxlength="'+max+'" rows="4">'+escape(value)+'</textarea></label>';
const check=(name,label,on)=>'<label><input type="checkbox" name="'+name+'" value="1"'+(on?' checked':'')+'> '+label+'</label>';
const formStart=action=>'<form method="post">'+hidden('action',action);
const section=(id,title,body)=>'<section id="'+id+'"><h2>'+title+'</h2>'+body+'</section>';

function productForm(p={}) {
  return formStart('product')+hidden('revision',p.revision||0)+
    (p.sku?hidden('sku',p.sku)+hidden('slug',p.slug)+ '<p>SKU '+escape(p.sku)+' · /products/'+escape(p.slug)+'</p>':
      inp('sku','New SKU','',48)+inp('slug','Product URL slug','',140))+
    fields.map(([key,label,max])=>inp(key,label,p[key],max)).join('')+
    inp('barcode','UPC or GTIN',p.gtin12||p.gtin13,13)+inp('price','Price in USD',p.price,8)+
    '<label>Collection<select name="collection">'+collections.map(c=>'<option'+(c===p.collection?' selected':'')+'>'+c+'</option>').join('')+'</select></label>'+
    area('description','Product description',p.description,6000)+area('images','HTTPS photo URLs, one per line',[...new Set([p.image,...(p.images||[])].filter(Boolean))].join('\n'),8008)+
    check('published','Published',p.published===true)+check('inStock','In stock',p.inStock===true)+
    '<button>Save product</button></form>';
}

export async function manageStore(request,env,base,lookupLegacy) {
  const status=auth(request,env);
  if(status!==200)return status===401?reply(null,401,{'WWW-Authenticate':'Basic realm="Elvarins Owner Dashboard", charset="UTF-8"'}):reply('Owner dashboard is awaiting setup.',503);
  const url=new URL(request.url),db=env.CUSTOMER_DB;
  if(!db)return reply('Store management is unavailable.',503);
  if(request.method==='POST'){
    const form=await formData(request);
    if(!form)return reply('Invalid request.',403);
    const action=read(form,'action');
    const error=action==='product'?await updateProduct(db,form,base,lookupLegacy):
      action==='copy'?await updateCopy(db,form):
      action==='tracking'?await updateTracking(db,form):'Unknown action.';
    if(error)return reply('<p>'+escape(error)+'</p><a href="'+adminPath+'">Return to dashboard</a>',400);
    const query=new URLSearchParams({saved:action});
    if(action==='product')query.set('sku',read(form,'sku'));
    return reply(null,303,{Location:adminPath+'?'+query+'#'+(action==='product'?'catalog':action)});
  }
  if(request.method==='HEAD')return reply(null);
  if(request.method!=='GET')return reply(null,405,{Allow:'GET, HEAD, POST'});
  const [rows,copy,orders]=await db.batch([
    db.prepare('SELECT sku,slug,data,published,in_stock,revision FROM storefront_products'),
    db.prepare('SELECT path,heading,body,revision FROM storefront_copy'),
    db.prepare("SELECT o.id,o.paid_at,t.carrier,t.tracking FROM checkout_orders o LEFT JOIN shipment_tracking t ON t.order_id=o.id WHERE o.status='paid' AND o.stripe_session_id GLOB 'cs_live_*' ORDER BY o.paid_at DESC LIMIT 50"),
  ]);
  const catalog=mergeCatalog(base,rows.results);
  const requestedSku=url.searchParams.get('sku')||'';
  const selected=catalog.get(requestedSku)||lookupLegacy(requestedSku);
  const products=[...catalog.values()].sort((a,b)=>a.title.localeCompare(b.title));
  const selectedPage=copy.results.find(x=>x.path===url.searchParams.get('page')) || {path:editablePages.includes(url.searchParams.get('page'))?url.searchParams.get('page'):'/'};
  const productLinks=products.map(p=>'<li><a href="?sku='+encodeURIComponent(p.sku)+'#catalog">'+escape(p.title)+'</a> · '+escape(p.sku)+' · '+(p.published?(p.inStock?'In stock':'Out of stock'):'Draft')+'</li>').join('');
  const pageLinks=editablePages.map(p=>'<a href="?page='+encodeURIComponent(p)+'#copy">'+escape(p==='/'?'Homepage':p)+'</a>').join(' ');
  const trackingForms=orders.results.map(o=>'<details><summary>'+escape(o.id)+' · '+(o.tracking?'Tracking recorded':'Awaiting tracking')+'</summary>'+
    formStart('tracking')+hidden('orderId',o.id)+inp('carrier','Carrier',o.carrier,40)+inp('tracking','Tracking number',o.tracking,80)+'<button>Save tracking</button></form></details>').join('');
  const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Elvarins Store Management</title><style>body{font:1rem system-ui;color:#18253a;background:#f2f5f9;margin:0}main{max-width:72rem;margin:auto;padding:1rem}section{background:#fff;padding:1rem;margin:1rem 0;border:1px solid #c6d1e2;border-radius:.5rem}form{display:grid;gap:.7rem;max-width:46rem}label{display:grid;gap:.2rem}input,select,textarea,button{font:inherit;padding:.45rem;box-sizing:border-box}label:has(input[type=checkbox]){display:block}nav a,.pagelinks a{display:inline-block;margin:.25rem .6rem .25rem 0}details{margin:.65rem 0}summary{cursor:pointer}</style><main><h1>Elvarins Store Management</h1><nav><a href="/api/account/admin">Overview &amp; Support</a><a href="#catalog">Products</a><a href="#copy">Page copy</a><a href="#tracking">Shipment tracking</a><a href="/api/account/fulfillment">Prep center</a></nav>'+
    (['product','copy','tracking'].includes(url.searchParams.get('saved'))?'<p role="status">Saved.</p>':'')+
    section('catalog','Products','<p><a href="'+adminPath+'#catalog">Add a product</a></p><form method="get">'+inp('sku','Find an item by SKU (including bci-UPC and page-slug)','',140)+'<button>Find product</button></form>'+
      (requestedSku&&!selected?'<p>No product matched that SKU.</p>':'')+'<h3>'+(selected?'Edit '+escape(selected.title):'New product')+'</h3>'+productForm(selected)+'<details><summary>Browse '+catalog.size+' main and managed products</summary><ul>'+productLinks+'</ul></details>')+
    section('copy','Page copy','<p class="pagelinks">'+pageLinks+'</p><p>Edit the owner-managed copy block. Page navigation, forms and the existing policy remain in place.</p>'+
      formStart('copy')+hidden('path',selectedPage.path)+hidden('revision',selectedPage.revision||0)+inp('heading','Heading for '+selectedPage.path,selectedPage.heading,180)+area('body','Text',selectedPage.body,6000)+'<button>Publish copy</button></form>')+
    section('tracking','Shipment tracking','<p>Save a tracking number from your fulfillment provider after confirming the shipment.</p>'+(trackingForms||'<p>No paid live orders yet.</p>'))+
    '</main></html>';
  return reply(html);
}
