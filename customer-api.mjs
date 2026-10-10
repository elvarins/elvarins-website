import { scrypt } from "node:crypto";
const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const sha=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
async function derive(password,salt){return new Promise((resolve,reject)=>scrypt(password,salt,32,{N:16384,r:8,p:5,maxmem:32*1024*1024},(error,key)=>error?reject(error):resolve('scrypt-v1$'+hex(key))));}
function equal(a,b){let d=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0;}
const cookie=value=>'__Host-elvarins_session='+value+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+(value?604800:0);
const reply=(data,status=200,session)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(session!==undefined?{'Set-Cookie':cookie(session)}:{})}});
async function limitedBody(request){const reader=request.body?.getReader();if(!reader)throw new Error('body');let bytes=0,parts=[];try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>8192){await reader.cancel();throw new Error('size');}parts.push(value);}}finally{reader.releaseLock();}const body=new Uint8Array(bytes);let offset=0;for(const p of parts){body.set(p,offset);offset+=p.length;}return JSON.parse(new TextDecoder().decode(body));}
async function throttle(db,key,limit,seconds){const now=Math.floor(Date.now()/1000),bucket=Math.floor(now/seconds),id=await sha(key+':'+bucket);const row=await db.prepare('INSERT INTO rate_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits').bind(id,now+seconds*2).first();return row.hits<=limit;}
async function sessionUser(request,db){const token=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)__Host-elvarins_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;return db.prepare('SELECT c.id,c.email,c.name FROM sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=? AND s.expires_at>?').bind(await sha(token),Math.floor(Date.now()/1000)).first();}
async function startSession(db,id){const token=random();await db.prepare('INSERT INTO sessions(token_hash,customer_id,expires_at) VALUES(?,?,?)').bind(await sha(token),id,Math.floor(Date.now()/1000)+604800).run();return token;}
export async function customerApi(request,env,products){
 const path=new URL(request.url).pathname,db=env.CUSTOMER_DB;if(!db)return reply({message:'Customer services are temporarily unavailable. Please contact sales@elvarins.com.'},503);
 if(request.method==='GET'&&path==='/api/account/me'){const user=await sessionUser(request,db);if(!user)return reply({user:null});const f=await db.prepare('SELECT sku FROM favorites WHERE customer_id=?').bind(user.id).all();return reply({user:{name:user.name,email:user.email},favorites:f.results.map(x=>x.sku)});}
 if(request.method!=='POST')return reply({message:'Method not allowed.'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({message:'Invalid request origin or format.'},403);
 let data;try{data=await limitedBody(request);}catch{return reply({message:'Please submit a valid form.'},400);}
 if(!data||typeof data!=='object'||Array.isArray(data))return reply({message:'Please submit a valid form.'},400);
 const now=Math.floor(Date.now()/1000),ip=request.headers.get('CF-Connecting-IP')||'unknown';
 if(!await throttle(db,ip+path,12,600))return reply({message:'Too many attempts. Please try again in ten minutes.'},429);
 await db.batch([db.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now),db.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now),db.prepare('DELETE FROM inquiries WHERE created_at<?').bind(now-63072000)]);
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'',name=typeof data.name==='string'?data.name.trim():'';
 const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&email.length<=254;
 try{
  if(path==='/api/inquiries'){
   if(data.website)return reply({message:'Please leave the website field empty.'},400);
   const topic=String(data.topic||''),message=typeof data.message==='string'?data.message.trim():'',sku=String(data.sku||'');
   if(!validEmail||name.length<2||name.length>100||message.length<10||message.length>3000||!['product','shipping','returns','general','privacy'].includes(topic)||sku&& !products.some(p=>p.sku===sku))return reply({message:'Check your name, email, topic and message (10–3,000 characters).'},400);
   if(!await throttle(db,email+path,5,3600))return reply({message:'Please wait before sending another request.'},429);
   const id=crypto.randomUUID();await db.prepare('INSERT INTO inquiries(id,name,email,topic,sku,message,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,name,email,topic,sku,message,now).run();return reply({message:'Your request has been received. Please keep your reference number. For urgent questions, email sales@elvarins.com.',reference:id},201);
  }
  if(path==='/api/account/signup'||path==='/api/account/login'||path==='/api/account/recover'){
   if(!validEmail)return reply({message:'Enter a valid email address.'},400);
   if(!await throttle(db,email+path,5,3600))return reply({message:'Too many attempts. Please try again in one hour.'},429);
   const password=typeof data.password==='string'?data.password:'';
   if(password.length<14||password.length>128)return reply({message:'Use a password with 14–128 characters.'},400);
   const existing=await db.prepare('SELECT * FROM customers WHERE email=?').bind(email).first();
   if(path==='/api/account/signup'){
    if(name.length<2||name.length>100)return reply({message:'Enter your name (2–100 characters).'},400);
    if(existing)return reply({message:'Unable to create this account. Try signing in or recovering your account.'},409);
    const id=crypto.randomUUID(),salt=random(),recovery=random(),hash=await derive(password,salt);
    await db.prepare('INSERT INTO customers(id,email,name,password_hash,salt,recovery_hash,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,email,name,hash,salt,await sha(recovery),now).run();
    return reply({user:{email,name},favorites:[],recoveryCode:recovery},201,await startSession(db,id));
   }
   if(path==='/api/account/recover'){
    const code=typeof data.recoveryCode==='string'?data.recoveryCode.trim():'';
    if(!existing||!equal(await sha(code),existing.recovery_hash))return reply({message:'The email or recovery code is incorrect.'},401);
    const salt=random(),recovery=random();await db.batch([db.prepare('UPDATE customers SET password_hash=?,salt=?,recovery_hash=? WHERE id=?').bind(await derive(password,salt),salt,await sha(recovery),existing.id),db.prepare('DELETE FROM sessions WHERE customer_id=?').bind(existing.id)]);
    return reply({user:{email,name:existing.name},recoveryCode:recovery},200,await startSession(db,existing.id));
   }
   const hash=await derive(password,existing?.salt||'elvarins-invalid-account');
   if(!existing||!equal(hash,existing.password_hash))return reply({message:'The email or password is incorrect.'},401);
   return reply({user:{email,name:existing.name}},200,await startSession(db,existing.id));
  }
  const user=await sessionUser(request,db);if(!user)return reply({message:'Please sign in first.'},401);
  if(path==='/api/account/logout'){const token=(request.headers.get('Cookie')||'').match(/__Host-elvarins_session=([a-f0-9]{64})/)?.[1];if(token)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha(token)).run();return reply({message:'Signed out.'},200,'');}
  if(path==='/api/account/favorite'){
   if(!products.some(p=>p.sku===data.sku)||typeof data.saved!=='boolean')return reply({message:'Choose a valid product.'},400);
   const query=data.saved?'INSERT OR IGNORE INTO favorites(customer_id,sku) VALUES(?,?)':'DELETE FROM favorites WHERE customer_id=? AND sku=?';await db.prepare(query).bind(user.id,data.sku).run();return reply({saved:data.saved});
  }
  return reply({message:'Page not found.'},404);
 }catch(error){console.error(JSON.stringify({event:'customer_api_error',path,name:error.name}));return reply({message:'We could not complete your request. Please try again or contact sales@elvarins.com.'},503);}
}
