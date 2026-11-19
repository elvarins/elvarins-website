import { findServiceCheckoutProduct } from './service-pages.mjs';
import { findBciCheckoutProduct } from './bci-catalog.mjs';

// Secure Stripe Checkout for the existing Cloudflare Worker. Secrets only via Worker bindings.
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const allowedMethods=(request,method)=>request.method===method;
const isSameOrigin=(request)=>{const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin};
const cents=value=>{const n=Number(value);return Number.isFinite(n)&&n>0&&Number.isSafeInteger(Math.round(n*100))?Math.round(n*100):0};
const safeInteger=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const configured=(env)=>String(env.CHECKOUT_ENABLED)==='true'&&!!env.CUSTOMER_DB&&['test','live'].includes(env.PAYMENT_MODE)&&(
 env.PAYMENT_MODE==='test'?String(env.STRIPE_TEST_SECRET_KEY||'').startsWith('sk_test_'):String(env.STRIPE_LIVE_SECRET_KEY||'').startsWith('sk_live_')
)&&String(env.SHIPPING_CONFIG_VERIFIED)==='true'&&safeInteger(Number(env.US_SHIPPING_FLAT_CENTS),0,10000)&&String(env.TAX_COMPLIANCE_CONFIRMED)==='true';
const secret=(env)=>env.PAYMENT_MODE==='test'?env.STRIPE_TEST_SECRET_KEY:env.STRIPE_LIVE_SECRET_KEY;
const postStripe=async(env,path,form,idempotency)=>{
 const h={Authorization:'Bearer '+secret(env),'Content-Type':'application/x-www-form-urlencoded'};
 if(idempotency)h['Idempotency-Key']=idempotency;
 const r=await fetch('https://api.stripe.com/v1/'+path,{method:'POST',headers:h,body:form.toString(),signal:AbortSignal.timeout(15000)});
 const data=await r.json().catch(()=>null);
 if(!r.ok||!data)throw Error('STRIPE_API_UNAVAILABLE');
 return data;
};
const stripeRead=async(env,path)=>{
 const r=await fetch('https://api.stripe.com/v1/'+path,{headers:{Authorization:'Bearer '+secret(env)},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Stripe lookup failed');
 return r.json();
};
export async function checkoutApi(request,env,products){
 if(request.method==='GET'||request.method==='HEAD'){const available=configured(env);
  const ids=new URL(request.url).searchParams.getAll('sku').slice(0,25);
  const catalogItems=ids.map(sku=>findBciCheckoutProduct(sku)||findServiceCheckoutProduct(sku)).filter(Boolean);
  return reply({available,mode:available?env.PAYMENT_MODE:'unavailable',catalogItems});}
 if(!allowedMethods(request,'POST'))return reply({message:'Method not allowed'},405);
 if(!isSameOrigin(request))return reply({message:'Cross-origin requests are not allowed'},403);
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply({message:'JSON body required'},415);
 if(!configured(env))return reply({message:'Secure checkout is being configured. No payment has been taken.',code:'CHECKOUT_UNAVAILABLE'},503);
 let input;
 try{const body=await request.text();if(body.length>12000)throw Error();input=JSON.parse(body)}catch{return reply({message:'Invalid cart'},400)}
 if(!Array.isArray(input?.items)||!input.items.length||input.items.length>25)return reply({message:'Cart must contain 1–25 items'},400);
 const known=new Map(products.map(p=>[p.sku,p])),picked=new Map();
 let amount=0;
 for(const item of input.items){
  if(typeof item?.sku!=='string'||!safeInteger(item.quantity,1,10)||picked.has(item.sku))return reply({message:'Invalid or duplicate cart item'},400);
  const p=known.get(item.sku)||findBciCheckoutProduct(item.sku)||findServiceCheckoutProduct(item.sku),unit=cents(p?.price);
  if(!p||!unit||unit>1000000||typeof p.title!=='string')return reply({message:'Product is not available'},422);
  picked.set(item.sku,{p,quantity:item.quantity,unit});
  amount+=unit*item.quantity;
 }
 if(amount>2500000)return reply({message:'Order exceeds checkout limit'},422);
 const charge=Number(env.US_SHIPPING_FLAT_CENTS);
 const freeThreshold=Number(env.US_FREE_SHIPPING_THRESHOLD_CENTS||0);
 const shipping=(freeThreshold>0&&amount>=freeThreshold)?0:charge;
 const publicOrigin=new URL(request.url).origin;
 const checkoutId=crypto.randomUUID(),created=Date.now();
 const cartJson=JSON.stringify([...picked].map(([sku,{quantity,unit}])=>({sku,quantity,unit})));
 try{
  await env.CUSTOMER_DB.prepare('INSERT INTO checkout_orders (id, cart_json, items_total_cents, shipping_cents, status, created_at) VALUES (?,?,?,?,?,?)').bind(checkoutId,cartJson,amount,shipping,'initiated',created).run();
 }catch{return reply({message:'Order system is temporarily unavailable. No payment taken.'},503)}
 const form=new URLSearchParams();
 form.set('mode','payment');
 form.set('adaptive_pricing[enabled]','false');
 form.set('client_reference_id',checkoutId);
 form.set('metadata[checkout_id]',checkoutId);
 form.set('success_url',publicOrigin+'/order-success?session_id={CHECKOUT_SESSION_ID}');
 form.set('cancel_url',publicOrigin+'/cart?cancelled=1');
 form.set('shipping_address_collection[allowed_countries][0]','US');
 form.set('billing_address_collection','required');
 form.set('customer_creation','always');
 if(String(env.STRIPE_TAX_ENABLED)==='true')form.set('automatic_tax[enabled]','true');
 let i=0;
 for(const [sku,{p,quantity,unit}] of picked){
   form.set(`line_items[${i}][price_data][currency]`,'usd');
   form.set(`line_items[${i}][price_data][unit_amount]`,String(unit));
   form.set(`line_items[${i}][price_data][product_data][name]`,p.title.slice(0,250));
   form.set(`line_items[${i}][quantity]`,String(quantity));
   i++;
 }
 form.set('shipping_options[0][shipping_rate_data][type]','fixed_amount');
 form.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]',String(shipping));
 form.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]','usd');
 form.set('shipping_options[0][shipping_rate_data][display_name]',shipping?'Standard US shipping':'Free US shipping');
 try{
  const session=await postStripe(env,'checkout/sessions',form,checkoutId);
  if(!session.id||!session.url||!session.url.startsWith('https://checkout.stripe.com/'))throw Error();
  await env.CUSTOMER_DB.prepare('UPDATE checkout_orders SET stripe_session_id=?,status=? WHERE id=?').bind(session.id,'created',checkoutId).run();
  return reply({url:session.url,mode:env.PAYMENT_MODE,checkoutId});
 }catch{
  await env.CUSTOMER_DB.prepare('UPDATE checkout_orders SET status=? WHERE id=?').bind('session_error',checkoutId).run().catch(()=>{});
  return reply({message:'Payment service could not start. No payment taken.'},502)
 }
}
const utf8=new TextEncoder();
async function signatureValid(raw,signature,secret){
 const bits=String(signature||'').split(',').map(x=>x.trim());
 const timestamp=bits.find(x=>x.startsWith('t='))?.slice(2);
 const signatures=bits.filter(x=>x.startsWith('v1=')).map(x=>x.slice(3));
 const ts=Number(timestamp);
 if(!Number.isSafeInteger(ts)||Math.abs(Date.now()/1000-ts)>300||!signatures.length)return false;
 const key=await crypto.subtle.importKey('raw',utf8.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 for(const signatureHex of signatures){
  if(!/^[a-f0-9]{64}$/i.test(signatureHex))continue;
  const bytes=new Uint8Array(signatureHex.match(/.{2}/g).map(x=>parseInt(x,16)));
  if(await crypto.subtle.verify('HMAC',key,bytes,utf8.encode(timestamp+'.'+raw)))return true;
 }
 return false;
}
export async function stripeWebhook(request,env){
 if(request.method!=='POST')return reply({message:'Method not allowed'},405);
 if(!env.CUSTOMER_DB||!String(env.STRIPE_WEBHOOK_SECRET||'').startsWith('whsec_'))return reply({message:'Webhook unavailable'},503);
 const raw=await request.text();
 if(raw.length>100000)return reply({message:'Body too large'},413);
 if(!await signatureValid(raw,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET))return reply({message:'Invalid signature'},400);
 let event;try{event=JSON.parse(raw)}catch{return reply({message:'Malformed payload'},400)}
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return reply({received:true});
 const id=event.data?.object?.metadata?.checkout_id,sessionId=event.data?.object?.id;
 if(!id||!sessionId)return reply({received:true});
 // Fetch payment state independently; never treat a browser redirect as payment proof.
 if(!configured(env))return reply({message:'Payment configuration unavailable'},503);
 let session;
 try{session=await stripeRead(env,'checkout/sessions/'+encodeURIComponent(sessionId))}catch{return reply({message:'Payment verification unavailable'},503)}
 if(session.payment_status!=='paid'||session.client_reference_id!==id)return reply({received:true});
 const order=await env.CUSTOMER_DB.prepare('SELECT id, items_total_cents, shipping_cents, status FROM checkout_orders WHERE id=? AND stripe_session_id=?').bind(id,sessionId).first();
 if(!order||order.status==='paid')return reply({received:true});
 if(session.currency!=='usd'||session.amount_total < order.items_total_cents+order.shipping_cents)return reply({message:'Amount mismatch'},409);
 const shippingDetails=session.collected_information?.shipping_details||session.shipping_details;
 const address=shippingDetails?.address;
 if(!address?.line1||address.country!=='US')return reply({message:'Shipping address unavailable'},409);
 await env.CUSTOMER_DB.prepare('UPDATE checkout_orders SET status=?, paid_at=?, customer_email=?, shipping_name=?, shipping_address_json=?, amount_paid_cents=? WHERE id=? AND status != ?')
 .bind('paid',Date.now(),String(session.customer_details?.email||'').slice(0,240),String(shippingDetails.name||session.customer_details?.name||'').slice(0,180),JSON.stringify(address).slice(0,2400),session.amount_total,id,'paid').run();
 return reply({received:true});
}
export async function checkoutStatus(request,env){
 if(request.method!=='GET')return reply({message:'Method not allowed'},405);
 const id=new URL(request.url).searchParams.get('session_id');
 if(!id||!/^cs_(test_|live_)[A-Za-z0-9]+$/.test(id)||!configured(env))return reply({status:'unknown'},200);
 const row=await env.CUSTOMER_DB.prepare('SELECT status FROM checkout_orders WHERE stripe_session_id=?').bind(id).first();
 return reply({status:row?.status==='paid'?'paid':'processing'});
}
export const checkoutConfigured=env=>configured(env);
