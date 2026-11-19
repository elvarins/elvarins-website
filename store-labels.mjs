import { escape } from './store-management.mjs';

const uuid=/^[a-f0-9-]{36}$/;
const shippoId=/^[a-f0-9]{32}$/;
const originValid=a=>a?.country==='US'&&a.name&&a.street1&&a.city&&/^[A-Z]{2}$/.test(a.state||'')&&/^\d{5}(-\d{4})?$/.test(a.zip||'');
const cents=value=>/^\d{1,4}(\.\d{1,2})?$/.test(String(value))?Math.round(Number(value)*100):0;

function getOrigin(env){
  if(!/^shippo_live_[A-Za-z0-9]+$/.test(env.SHIPPO_API_TOKEN||''))return null;
  try{const a=JSON.parse(env.SHIPPO_ORIGIN_JSON||'null');return originValid(a)?a:null;}
  catch{return null;}
}

async function shippo(env,path,data){
  const r=await fetch('https://api.goshippo.com'+path,{method:data?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(18000),
    headers:{Authorization:'ShippoToken '+env.SHIPPO_API_TOKEN,'Content-Type':'application/json','SHIPPO-API-VERSION':'2018-02-08'},
    ...(data?{body:JSON.stringify(data)}:{})});
  if(!r.ok)throw new Error('Carrier request failed');
  return r.json();
}

async function eligibleOrder(db,id){
  if(!uuid.test(id))return null;
  return db.prepare("SELECT id,shipping_name,shipping_address_json FROM checkout_orders WHERE id=? AND status='paid' AND stripe_session_id GLOB 'cs_live_*' AND NOT EXISTS(SELECT 1 FROM shipment_tracking WHERE order_id=?) AND NOT EXISTS(SELECT 1 FROM purchased_labels WHERE order_id=?)").bind(id,id,id).first();
}

export async function requestLabelRates(env,form){
  const from=getOrigin(env);
  if(!from)return 'Configure the Shippo live key and confirmed U.S. ship-from address first.';
  const db=env.CUSTOMER_DB,id=form.get('orderId')||'';
  const order=await eligibleOrder(db,id);
  if(!order)return 'Only paid live orders without tracking or a label purchase can be quoted.';
  const keys=['length','width','height','weight'];
  const fields=keys.map(k=>form.get(k)||'');
  if(fields.some((value,i)=>!/^\d{1,3}(\.\d{1,2})?$/.test(value)||Number(value)<=0||Number(value)>(i===3?150:108)))return 'Enter valid package dimensions and weight.';
  const address=JSON.parse(order.shipping_address_json||'null');
  const to=address&&{name:order.shipping_name,street1:address.line1,street2:address.line2||'',city:address.city,state:address.state,zip:address.postal_code,country:address.country};
  if(!originValid(to))return 'The order needs a complete U.S. delivery address.';
  const parcel={...Object.fromEntries(keys.map((k,i)=>[k,fields[i]])),distance_unit:'in',mass_unit:'lb'};
  let shipment;
  try{shipment=await shippo(env,'/shipments/',{address_from:from,address_to:to,parcels:[parcel],async:false});}
  catch{return 'Carrier quotes are unavailable. No postage was purchased.';}
  if(shipment.test!==false)return 'No live carrier rates returned.';
  const rates=(Array.isArray(shipment.rates)?shipment.rates:[]).filter(r=>r.test===false&&r.currency==='USD'&&shippoId.test(r.object_id||'')&&cents(r.amount)>0&&r.provider&&r.servicelevel?.name).sort((a,b)=>cents(a.amount)-cents(b.amount)).slice(0,8);
  if(!rates.length)return 'No live U.S. rates returned.';
  const now=Date.now();
  await db.batch([db.prepare('DELETE FROM label_quotes WHERE expires_at<?').bind(now),
    ...rates.map(r=>db.prepare('INSERT INTO label_quotes(id,order_id,rate_id,carrier,service,cents,expires_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,r.object_id,String(r.provider).slice(0,80),String(r.servicelevel.name).slice(0,120),cents(r.amount),now+900000))]);
  return null;
}

function validLabelUrl(value){
  try{
    const u=new URL(value);
    return u.protocol==='https:'&&!u.username&&!u.password&&
      (u.hostname==='shippo-delivery.s3.amazonaws.com'||u.hostname.endsWith('.goshippo.com')||u.hostname==='shippo-delivery.s3.us-west-2.amazonaws.com');
  }catch{return false;}
}

export async function buyLabel(env,form){
  if(!getOrigin(env))return 'Shippo purchase setup is incomplete.';
  if(form.get('confirm')!=='1')return 'Confirm the charge and verify the order has not been refunded.';
  const db=env.CUSTOMER_DB,id=form.get('quoteId')||'';
  if(!uuid.test(id))return 'Choose a valid carrier quote.';
  const quote=await db.prepare('SELECT id,order_id,rate_id,cents FROM label_quotes WHERE id=? AND expires_at>?').bind(id,Date.now()).first();
  if(!quote||!await eligibleOrder(db,quote.order_id))return 'Quote expired or order is no longer eligible.';
  let rate;
  try{rate=await shippo(env,'/rates/'+quote.rate_id+'/');}
  catch{return 'Rate refresh failed. No postage was purchased.';}
  if(rate.object_id!==quote.rate_id||rate.test!==false||rate.currency!=='USD'||cents(rate.amount)!==quote.cents)return 'Rate changed. Request a fresh quote.';
  const claim=await db.prepare("INSERT OR IGNORE INTO purchased_labels(order_id,quote_id,status) SELECT o.id,?,'pending' FROM checkout_orders o WHERE o.id=? AND o.status='paid' AND o.stripe_session_id GLOB 'cs_live_*' AND NOT EXISTS(SELECT 1 FROM shipment_tracking WHERE order_id=o.id)").bind(id,quote.order_id).run();
  if(!claim.meta.changes)return 'This order already has a label or is no longer eligible.';
  let result;
  try{result=await shippo(env,'/transactions/',{rate:quote.rate_id,label_file_type:'PDF',async:false,metadata:'Elvarins order '+quote.order_id});}
  catch{}
  const succeeded=result?.status==='SUCCESS'&&result.test!==true&&result.was_test!==true&&shippoId.test(result.object_id||'');
  await db.prepare("UPDATE purchased_labels SET status=?,transaction_id=?,tracking=?,label_url=? WHERE order_id=? AND status='pending'").bind(succeeded?'purchased':'uncertain',String(result?.object_id||'').slice(0,64),String(result?.tracking_number||'').slice(0,100),succeeded&&validLabelUrl(result.label_url)?result.label_url:null,quote.order_id).run();
  return succeeded?null:'Purchase status is uncertain. Check Shippo before purchasing postage again.';
}

export async function labelControls(env,orders){
  if(!getOrigin(env))return '<p>Label purchase needs a live Shippo key and confirmed New York ship-from address.</p>';
  const db=env.CUSTOMER_DB;
  const [quotes,labels]=await db.batch([
    db.prepare('SELECT id,order_id,carrier,service,cents FROM label_quotes WHERE expires_at>? ORDER BY cents LIMIT 400').bind(Date.now()),
    db.prepare('SELECT order_id,status,tracking,label_url FROM purchased_labels'),
  ]);
  return orders.map(order=>{
    const label=labels.results.find(r=>r.order_id===order.id);
    const intro='<details><summary>'+escape(order.id)+'</summary>';
    if(label)return intro+'<p>Label: '+escape(label.status)+(label.tracking?' · '+escape(label.tracking):'')+'</p>'+
      (label.label_url?'<a href="'+escape(label.label_url)+'" rel="noreferrer">Open label</a>':'')+
      (label.status!=='purchased'?'<p>Check Shippo before taking further action.</p>':'<p>Save tracking under Shipment tracking once the package is ready to send.</p>')+'</details>';
    if(order.tracking)return '';
    const size=['length','width','height','weight'].map(k=>'<label>'+k+(k==='weight'?' (lb)':' (in)')+'<input name="'+k+'" inputmode="decimal" required></label>').join('');
    return intro+'<form method="post"><input type="hidden" name="action" value="label-rates"><input type="hidden" name="orderId" value="'+escape(order.id)+'">'+size+'<button>Get carrier rates</button></form>'+
      quotes.results.filter(r=>r.order_id===order.id).map(q=>'<form method="post"><input type="hidden" name="action" value="label-buy"><input type="hidden" name="quoteId" value="'+escape(q.id)+'"><label><input type="checkbox" name="confirm" value="1" required> Order is eligible to ship. I approve the postage charge.</label><button>Buy '+escape(q.carrier)+' '+escape(q.service)+' · $'+(q.cents/100).toFixed(2)+'</button></form>').join('')+'</details>';
  }).join('')||'<p>No paid live orders awaiting labels.</p>';
}
