import { escape, safeJson } from './store-management.mjs';

export const photoUploadPath='/api/account/admin/manage/photos';
const mediaPrefix='/media/products/';
const maxPhotoBytes=524288;
const photoIds=/^[a-f0-9]{64}$/;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const layoutBlocks={
  hero:'.hero', categories:'.category-discovery', transformers:'[aria-labelledby="row-transformers"]',
  marvel:'[aria-labelledby="row-marvel"]', funko:'[aria-labelledby="row-funko"]',
  brands:'.brand-discovery', support:'.home-support', newsletter:'.newsletter-panel',
};

function mimeFor(bytes){
  const b=new Uint8Array(bytes);
  if(b.length<16)return null;
  if(b[0]===255&&b[1]===216&&b[2]===255&&b.at(-2)===255&&b.at(-1)===217)return 'image/jpeg';
  if([137,80,78,71,13,10,26,10].every((n,i)=>n===b[i])&&String.fromCharCode(...b.slice(12,16))==='IHDR')return 'image/png';
  if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP'
    &&new DataView(bytes).getUint32(4,true)+8===b.length)return 'image/webp';
  return null;
}

export function uploadForm(lastId){
  const existing=photoIds.test(lastId||'')?'<p>Uploaded. Paste this URL into the product photo field:</p><input readonly aria-label="Uploaded photo URL" value="https://elvarins.com'+mediaPrefix+lastId+'"><p><a href="'+mediaPrefix+lastId+'">Open image</a></p>':'';
  return '<form method="post" action="'+photoUploadPath+'" enctype="multipart/form-data"><label>Product photo (JPEG, PNG or WebP, up to 512 KB)<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required></label><button>Upload photo</button></form>'+existing;
}

export async function uploadPhoto(request,db){
  if(request.method!=='POST')return new Response(null,{status:405,headers:{...headers,Allow:'POST'}});
  if(request.headers.get('Origin')!==new URL(request.url).origin)return new Response('Invalid origin.',{status:403,headers});
  const type=request.headers.get('Content-Type')||'';
  if(!type.startsWith('multipart/form-data;')||!request.body)return new Response('Choose an image file.',{status:400,headers});
  const reader=request.body.getReader(), chunks=[];
  let total=0;
  try{
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      total+=value.byteLength;
      if(total>maxPhotoBytes+8192){await reader.cancel();return new Response('File is too large.',{status:413,headers});}
      chunks.push(value);
    }
  }finally{reader.releaseLock();}
  let photo;
  try{photo=(await new Response(new Blob(chunks),{headers:{'Content-Type':type}}).formData()).get('photo');}
  catch{return new Response('Invalid upload.',{status:400,headers});}
  if(!(photo instanceof File)||!photo.size||photo.size>maxPhotoBytes)return new Response('Choose an image up to 512 KB.',{status:400,headers});
  const bytes=await photo.arrayBuffer(),mime=mimeFor(bytes);
  if(!mime||photo.type!==mime)return new Response('Upload a JPEG, PNG or WebP image.',{status:415,headers});
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const id=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
  await db.prepare('INSERT OR IGNORE INTO storefront_media(id,mime,contents,created_at) VALUES(?,?,?,?)').bind(id,mime,bytes,Date.now()).run();
  return new Response(null,{status:303,headers:{...headers,Location:'/api/account/admin/manage?photo='+id+'#photos'}});
}

export async function servePhoto(request,db){
  const id=new URL(request.url).pathname.slice(mediaPrefix.length);
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  if(!photoIds.test(id)||!db)return new Response(null,{status:404,headers});
  const row=await db.prepare('SELECT mime,contents FROM storefront_media WHERE id=?').bind(id).first();
  if(!row)return new Response(null,{status:404,headers});
  return new Response(request.method==='HEAD'?null:new Uint8Array(row.contents),{headers:{
    'Content-Type':row.mime,'Cache-Control':'public, max-age=31536000, immutable',
    'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",
  }});
}

export async function getLayout(db){
  const row=await db.prepare('SELECT ordering,hidden FROM storefront_layout WHERE id=1').first();
  if(!row)return null;
  return {ordering:JSON.parse(row.ordering),hidden:JSON.parse(row.hidden)};
}

export const layoutForm=layout=>{
  const ordering=layout?.ordering||Object.keys(layoutBlocks);
  return '<form method="post"><input type="hidden" name="action" value="layout"><label>Homepage section order (one per line)<textarea name="ordering" rows="8" required>'+escape(ordering.join('\n'))+'</textarea></label>'+
    '<p>Reorder the listed blocks. The product catalog and legal navigation stay available.</p>'+
    Object.keys(layoutBlocks).map(key=>'<label><input type="checkbox" name="hidden" value="'+key+'"'+(layout?.hidden.includes(key)?' checked':'')+'> Hide '+key+'</label>').join('')+
    '<button>Publish layout</button></form>';
};

export async function updateLayout(db,form){
  const ordering=(form.get('ordering')||'').trim().split(/\s+/),hidden=[...new Set(form.getAll('hidden'))];
  const keys=Object.keys(layoutBlocks);
  if(ordering.length!==keys.length||new Set(ordering).size!==keys.length||
    [...ordering,...hidden].some(key=>!Object.hasOwn(layoutBlocks,key)))return 'Keep each listed block exactly once.';
  await db.prepare('INSERT INTO storefront_layout(id,ordering,hidden) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET ordering=excluded.ordering,hidden=excluded.hidden').bind(JSON.stringify(ordering),JSON.stringify(hidden)).run();
  return null;
}

export function addLayout(html,layout){
  const block='<script type="application/json" id="elvarins-layout">'+safeJson({...layout,selectors:layoutBlocks})+'</script><script src="/layout-controls.js?v=1" defer></script>';
  return html.replace('</body>',()=>block+'</body>');
}

export const layoutScript=`(()=>{const raw=document.getElementById('elvarins-layout');if(!raw)return;const config=JSON.parse(raw.textContent);const nodes=new Map(config.ordering.map(name=>[name,document.querySelector(config.selectors[name])]).filter(([,el])=>el));const groups=new Map();for(const el of nodes.values()){const group=groups.get(el.parentNode)||[];group.push(el);groups.set(el.parentNode,group);}for(const [parent,group] of groups){group.sort((a,b)=>a.compareDocumentPosition(b)&4?-1:1);const slots=group.map(el=>{const mark=document.createComment('layout');parent.insertBefore(mark,el);return mark;});for(let i=0;i<group.length;i++)slots[i].replaceWith(config.ordering.map(name=>nodes.get(name)).filter(el=>el&&group.includes(el))[i]);}for(const name of config.hidden)if(nodes.has(name))nodes.get(name).style.display='none';})();`;

export async function sendTracking(env){
  const db=env.CUSTOMER_DB;
  if(!db||typeof env.TRACKING_EMAIL?.send!=='function')return;
  const now=Date.now();
  // A crashed delivery has unknown provider status. Do not blindly resend it.
  await db.prepare("UPDATE tracking_delivery SET state='uncertain' WHERE state='sending' AND next_attempt<?").bind(now).run();
  const pending=(await db.prepare("SELECT t.order_id,t.carrier,t.tracking,o.customer_email FROM shipment_tracking t JOIN checkout_orders o ON o.id=t.order_id LEFT JOIN tracking_delivery d ON d.order_id=t.order_id AND d.carrier=t.carrier AND d.tracking=t.tracking WHERE o.status='paid' AND o.stripe_session_id GLOB 'cs_live_*' AND o.customer_email IS NOT NULL AND (d.order_id IS NULL OR (d.state='retry' AND d.attempts<5 AND d.next_attempt<=?)) ORDER BY t.updated_at LIMIT 10").bind(now).all()).results;
  for(const row of pending){
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.customer_email)||row.customer_email.length>254)continue;
    const lease=crypto.randomUUID();
    const claim=await db.prepare("INSERT INTO tracking_delivery(order_id,carrier,tracking,state,attempts,next_attempt,lease) VALUES(?,?,?,'sending',1,?,?) ON CONFLICT(order_id,carrier,tracking) DO UPDATE SET state='sending',attempts=attempts+1,next_attempt=excluded.next_attempt,lease=excluded.lease WHERE state='retry' AND attempts<5 AND next_attempt<=?").bind(row.order_id,row.carrier,row.tracking,now+3600000,lease,now).run();
    if(!claim.meta.changes)continue;
    const recipient=row.customer_email;
    const mail={from:'notifications@notify.elvarins.com',to:recipient,replyTo:'sales@elvarins.com',subject:'Your Elvarins shipment tracking',
      text:'Shipping information for order '+row.order_id+'\n\nCarrier: '+row.carrier+'\nTracking number: '+row.tracking+'\n\nQuestions? Contact sales@elvarins.com.'};
    let state='sent';
    try{await env.TRACKING_EMAIL.send(mail);}
    catch(error){state=['E_RATE_LIMIT','E_RATE_LIMIT_EXCEEDED','E_TEMPORARY'].includes(error?.code)?'retry':'uncertain';}
    await db.prepare('UPDATE tracking_delivery SET state=?,next_attempt=? WHERE order_id=? AND carrier=? AND tracking=? AND lease=?').bind(state,Date.now()+600000,row.order_id,row.carrier,row.tracking,lease).run();
  }
}
