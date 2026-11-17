// Stripe Checkout sandbox-only endpoint for Cloudflare Pages Functions.
// No user-provided Stripe credentials are stored in GitHub.
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const cents=(value)=>{const number=Number(value);return Number.isFinite(number)&&number>0?Math.round(number*100):0};
export async function onRequestPost({request,env}){
  if(env.STRIPE_CHECKOUT_TEST_ENABLED!=="true"||!String(env.STRIPE_TEST_SECRET_KEY||"").startsWith("sk_test_"))return json({error:"Stripe sandbox checkout is not configured."},503);
  const origin=new URL(request.url).origin;
  if(request.headers.get("origin")!==origin)return json({error:"Cross-origin checkout is not allowed."},403);
  if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))return json({error:"JSON required."},415);
  const length=Number(request.headers.get("content-length")||0);
  if(length>10000)return json({error:"Request too large."},413);
  let payload;
  try{payload=await request.json()}catch{return json({error:"Invalid JSON."},400)}
  const entries=payload?.items;
  if(!Array.isArray(entries)||entries.length<1||entries.length>10)return json({error:"Choose 1–10 products."},400);
  const requested=new Map();
  for(const item of entries){
    if(typeof item?.sku!=="string"||!/^[-A-Za-z0-9_]{1,64}$/.test(item.sku)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10)return json({error:"Invalid SKU or quantity."},400);
    if(requested.has(item.sku))return json({error:"Duplicate SKU."},400);
    requested.set(item.sku,item.quantity);
  }
  let catalog;
  try{
    const url=new URL("/catalog/products.json",origin);
    const res=await env.ASSETS.fetch(new Request(url.toString()));
    if(!res.ok)throw Error("Catalog fetch failed");
    catalog=(await res.json()).products;
    if(!Array.isArray(catalog))throw Error("Catalog missing");
  }catch{return json({error:"Catalog is temporarily unavailable."},503)}
  const bySku=new Map(catalog.map(p=>[p.sku,p]));
  const form=new URLSearchParams();
  form.set("mode","payment");
  form.set("success_url",origin+"/checkout-sandbox.html?result=success&session_id={CHECKOUT_SESSION_ID}");
  form.set("cancel_url",origin+"/checkout-sandbox.html?result=cancelled");
  form.set("shipping_address_collection[allowed_countries][0]","US");
  form.set("billing_address_collection","required");
  form.set("metadata[integration]","elvarins_sandbox");
  let total=0,index=0;
  for(const [sku,quantity] of requested){
    const p=bySku.get(sku);
    const amount=cents(p?.price);
    if(!p||amount<50||amount>1000000||!p.title||p.title.length>250)return json({error:"This product is unavailable for sandbox testing."},422);
    total+=amount*quantity;
    form.set(`line_items[${index}][price_data][currency]`,"usd");
    form.set(`line_items[${index}][price_data][unit_amount]`,String(amount));
    form.set(`line_items[${index}][price_data][product_data][name]`,p.title.slice(0,250));
    form.set(`line_items[${index}][quantity]`,String(quantity));
    ++index;
  }
  if(total>1000000)return json({error:"Sandbox cart total exceeds test limit."},422);
  // Test-only shipping rate is deliberately not specified. This is NOT a launch-ready checkout.
  // No orders may be fulfilled from this sandbox endpoint.
  let stripe;
  try{stripe=await fetch("https://api.stripe.com/v1/checkout/sessions",{
    method:"POST",headers:{"Authorization":"Bearer "+env.STRIPE_TEST_SECRET_KEY,"Content-Type":"application/x-www-form-urlencoded","Stripe-Version":"2025-08-27.basil"},body:form.toString()
  })}catch{return json({error:"Stripe sandbox is temporarily unreachable."},502)}
  const result=await stripe.json().catch(()=>null);
  if(!stripe.ok||!result?.url||!result.url.startsWith("https://checkout.stripe.com/"))return json({error:"Could not create sandbox checkout session.",detail:result?.error?.type||"stripe_error"},502);
  return json({url:result.url,mode:"test"});
}
export const onRequest=()=>json({error:"Method not allowed."},405);
