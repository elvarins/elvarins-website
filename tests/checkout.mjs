import assert from 'node:assert/strict';
import {checkoutApi} from '../checkout-api.mjs';
const origin='https://elvarins.com';
const products=[{sku:'TEST-1',title:'Verified test product',price:19.99}];
let r=await checkoutApi(new Request(origin+'/api/checkout'),{},products);
assert.equal(r.status,200);assert.deepEqual(await r.json(),{available:false,mode:'unavailable',freeShippingThresholdCents:14900,catalogItems:[]});
r=await checkoutApi(new Request(origin+'/api/checkout?sku=page-cadet-gourmet-bully-sticks-12-count-1-32-lb'),{},products);
const lookup=await r.json();assert.equal(lookup.available,false);assert.equal(lookup.catalogItems.length,1);assert.equal(lookup.catalogItems[0].price,48.99);
r=await checkoutApi(new Request(origin+'/api/checkout',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({items:[{sku:'TEST-1',quantity:1}]})}),{},products);
assert.equal(r.status,503);assert.equal((await r.json()).code,'CHECKOUT_UNAVAILABLE');
r=await checkoutApi(new Request(origin+'/api/checkout',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'}),{},products);assert.equal(r.status,403);
console.log('PASS: checkout availability and service-page catalog are public, fail-closed and same-origin protected');

const previousFetch=globalThis.fetch;
const captured=[];
globalThis.fetch=async (_url,options)=>{
  const form=new URLSearchParams(options.body);
  captured.push(form.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'));
  return Response.json({id:'cs_test_local',url:'https://checkout.stripe.com/c/pay/mock'});
};
const env={CHECKOUT_ENABLED:'true',PAYMENT_MODE:'test',STRIPE_TEST_SECRET_KEY:'sk_test_local',STRIPE_WEBHOOK_SECRET:'whsec_local',
  US_SHIPPING_FLAT_CENTS:'899',CUSTOMER_DB:{prepare(){return {bind(){return {async run(){}}}}}}};
const buy=sku=>new Request(origin+'/api/checkout',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({items:[{sku,quantity:1}]})});
try{
  for(const price of [148.99,149,149.01]){
    r=await checkoutApi(buy('TEST-1'),env,[{...products[0],price}]);
    assert.equal(r.status,200);
  }
  assert.deepEqual(captured,['899','0','0']);
  r=await checkoutApi(buy('page-stainless-steel-whisk-set-2-pieces-073297774770'),env,products);
  assert.equal(r.status,422);
  assert.equal(captured.length,3);
}finally{globalThis.fetch=previousFetch;}
console.log('PASS: $149 inclusive shipping boundary and retired product excluded from checkout');
