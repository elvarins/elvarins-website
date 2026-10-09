// Quote only: this module never buys a label or submits an order.
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const unavailable=(code='SHIPPING_NOT_CONFIGURED')=>reply(503,{code,message:'Please request shipping details from our team. Shipping charges will be confirmed before purchase.'});
async function boundedJSON(body,max){const reader=body.getReader();let size=0,text='';const decoder=new TextDecoder();try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new Error('Too large');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();return JSON.parse(text);}finally{reader.releaseLock();}}
export async function shippingQuote(request,env,products,transport=fetch){
 if(request.method!=='POST')return reply(405,{message:'Use POST to request shipping.'});
 const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return reply(403,{message:'Request shipping from the Elvarins website.'});
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply(415,{message:'Send a JSON shipping request.'});
 let data;try{data=await boundedJSON(request.body,2048);}catch{return reply(400,{message:'Invalid shipping request.'});}
 const p=products.find(p=>p.sku===data?.sku);
 if(!p||!Number.isInteger(data.quantity)||data.quantity<1||data.quantity>20||typeof data.zip!=='string'||!/^\d{5}(-\d{4})?$/.test(data.zip))return reply(400,{message:'Choose a valid item, quantity from 1 to 20 and U.S. ZIP code.'});
 if(!env.SHIPPO_API_TOKEN?.startsWith('shippo_live_'))return unavailable();
 let from,profile;try{from=JSON.parse(env.SHIPPO_ORIGIN_JSON);profile=JSON.parse(env.SHIPPO_PARCEL_PROFILES_JSON)?.[data.sku]?.[String(data.quantity)];}catch{return unavailable();}
 if(from?.country!=='US'||!from.street1||!from.city||!from.state||!/^\d{5}(-\d{4})?$/.test(from.zip)||profile?.verified!==true)return unavailable('PARCEL_NOT_CONFIGURED');
 const parcel=profile.parcel;
 if(!parcel||parcel.distance_unit!=='in'||parcel.mass_unit!=='lb'||!['length','width','height','weight'].every(k=>Number.isFinite(Number(parcel[k]))&&Number(parcel[k])>0))return unavailable('PARCEL_NOT_CONFIGURED');
 try{
 const response=await transport('https://api.goshippo.com/shipments/',{method:'POST',headers:{Authorization:'ShippoToken '+env.SHIPPO_API_TOKEN,'Content-Type':'application/json','SHIPPO-API-VERSION':'2018-02-08'},body:JSON.stringify({address_from:from,address_to:{zip:data.zip,country:'US'},parcels:[Object.fromEntries(['length','width','height','weight','distance_unit','mass_unit'].map(k=>[k,String(parcel[k])]))],async:false}),signal:AbortSignal.timeout(10000)});
 if(!response.ok||!response.body)return unavailable('CARRIER_UNAVAILABLE');
 const shipment=await boundedJSON(response.body,262144);if(shipment.test===true)return unavailable('TEST_RATES_REJECTED');
 const rates=(Array.isArray(shipment.rates)?shipment.rates:[]).filter(r=>r.test!==true&&r.currency==='USD'&&/^\d+(\.\d{1,2})?$/.test(r.amount)&&Number(r.amount)>0&&r.provider&&r.servicelevel?.name).map(r=>({carrier:r.provider,service:r.servicelevel.name,amount:Number(r.amount),currency:'USD'})).sort((a,b)=>a.amount-b.amount).slice(0,8);
 if(!rates.length)return unavailable('NO_RATES');
 return reply(200,{sku:p.sku,quantity:data.quantity,itemSubtotal:Math.round(p.price*100)*data.quantity/100,currency:'USD',rates,estimated:true,message:'Estimated shipping to your ZIP code. Final charges require your complete delivery address. Taxes are additional.'});
 }catch{return unavailable('CARRIER_UNAVAILABLE');}
}
