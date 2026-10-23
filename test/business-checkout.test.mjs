import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{checkoutInput,safeReceipt} from '../workers/business-checkout/index.mjs';
const req=(body)=>new Request('https://demo.example/api/business/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
function mocked(options={}){
 const saved=[],applied=[];
 const env={
 BUSINESS_AUTH:{verifyMerchantSession:async()=>options.actor||{merchantId:'cardoneDemo',role:'merchant_admin',verified:true,paymentsEnabled:true}},
 BUSINESS_CATALOG:{getApprovedProduct:async()=>options.product||{issuerAuthorized:true,status:'active',kind:'service',priceId:'price_abcdef',mode:'one_time',approvedPaymentTerms:true}},
 PAYMENT_GATEWAY:{
 createHostedCheckout:async()=>({checkoutId:'session_test_123',url:'https://checkout.stripe.com/pay/demo'}),
 verifyWebhook:async(headers,raw)=>{if(!headers.get('x-provider-test-signature'))throw Error('invalid');return JSON.parse(raw);}
 },
 PRIVATE_RECEIPTS:{reservePending:async r=>saved.push(r),applyVerifiedEvent:async e=>{if(!applied.some(x=>x.eventId===e.eventId))applied.push(e);}}
 };return {env,saved,applied};
}
test('rejects every client-supplied card, bank, price, merchant and personal field',()=>{
 assert.equal(checkoutInput({productId:'service123',idempotencyKey:'order_123456',consentToHostedCheckout:true,cardNumber:'4111111111111111'}),null);
 assert.equal(checkoutInput({productId:'service123',idempotencyKey:'order_123456',consentToHostedCheckout:true,amount:100}),null);
 assert.equal(checkoutInput({productId:'service123',idempotencyKey:'order_123456',consentToHostedCheckout:true,bankAccount:'1234'}),null);
 assert.equal(checkoutInput({productId:'service123',idempotencyKey:'order_123456',consentToHostedCheckout:false}),null);
 assert.ok(checkoutInput({productId:'service123',idempotencyKey:'order_123456',consentToHostedCheckout:true}));
});
test('checkout refuses unconnected gateway and unverified merchant',async()=>{
 let res=await worker.fetch(req({productId:'service123',idempotencyKey:'order_123456',consentToHostedCheckout:true}),{});
 assert.equal(res.status,503);
 const {env}=mocked({actor:{merchantId:'cardoneDemo',role:'visitor',verified:true,paymentsEnabled:true}});
 res=await worker.fetch(req({productId:'service123',idempotencyKey:'order_123456',consentToHostedCheckout:true}),env);
 assert.equal(res.status,403);
});
test('actual investment offers cannot use generic hosted checkout',async()=>{
 const {env,saved}=mocked({product:{issuerAuthorized:true,status:'active',kind:'security',priceId:'price_abcdef',mode:'one_time',approvedPaymentTerms:true}});
 const res=await worker.fetch(req({productId:'service123',idempotencyKey:'order_123456',consentToHostedCheckout:true}),env);
 assert.equal(res.status,409);assert.equal((await res.json()).code,'official_offering_portal_required');assert.equal(saved.length,0);
});
test('authorized non-security service uses hosted checkout and private receipt only',async()=>{
 const {env,saved}=mocked();
 const res=await worker.fetch(req({productId:'service123',idempotencyKey:'order_123456',consentToHostedCheckout:true}),env);
 assert.equal(res.status,200);const data=await res.json();
 assert.equal(data.checkoutUrl,'https://checkout.stripe.com/pay/demo');
 assert.equal(data.noRawPaymentData,true);
 assert.equal(saved.length,1);
 assert.equal(saved[0].merchantId,'cardoneDemo');assert.equal(saved[0].productId,'service123');
});
test('verified payment event strips provider card, payer and bank details',async()=>{
 const event={id:'evt_abcdef',checkoutId:'session_test_123',merchantId:'cardoneDemo',productId:'service123',status:'succeeded',cardNumber:'4111111111111111',email:'person@example.net',bankAccount:'123'};
 const receipt=safeReceipt(event);assert.equal(receipt.status,'succeeded');
 assert.doesNotMatch(JSON.stringify(receipt),/411111|person@|bankAccount/);
 const {env,applied}=mocked();
 let reqWeb=new Request('https://demo.example/api/business/payment-webhook',{method:'POST',headers:{'x-provider-test-signature':'ok'},body:JSON.stringify(event)});
 const res=await worker.fetch(reqWeb,env);assert.equal(res.status,200);assert.equal(applied.length,1);
 reqWeb=new Request('https://demo.example/api/business/payment-webhook',{method:'POST',body:JSON.stringify(event)});
 assert.equal((await worker.fetch(reqWeb,env)).status,403);
});
