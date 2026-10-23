// Business checkout adapter contract. No raw payment credentials, issuer impersonation,
// broker-dealer authority, subscription billing or security transactions are enabled here.
// Provider-bound services must be configured only after verified merchant authorization.
const json=(obj,status=200)=>Response.json(obj,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(code,status)=>json({ok:false,code},status);
const id=/^[A-Za-z0-9_-]{6,80}$/;
const keys=(object,allowed)=>Object.keys(object).every(k=>allowed.includes(k));
const safe=(value)=>typeof value==='string'&&id.test(value);
const HTTPS=(value)=>{try{let u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
function checkoutInput(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||!keys(body,['productId','idempotencyKey','consentToHostedCheckout']))return null;
 if(!safe(body.productId)||!safe(body.idempotencyKey)||body.consentToHostedCheckout!==true)return null;
 return {productId:body.productId,idempotencyKey:body.idempotencyKey};
}
function safeReceipt(event){
 if(!event||typeof event!=='object'||!safe(event.id)||!safe(event.checkoutId)||!safe(event.merchantId)||!safe(event.productId))return null;
 if(!['succeeded','failed','refunded'].includes(event.status))return null;
 // Do not copy customer, payment method, PAN, bank details, addresses or card metadata.
 return {eventId:event.id,checkoutId:event.checkoutId,merchantId:event.merchantId,productId:event.productId,status:event.status,provider:'merchant-hosted',verifiedAt:new Date().toISOString()};
}
export default {
 async fetch(request,env){
   const u=new URL(request.url);
   if(u.pathname==='/health'&&request.method==='GET')return json({ok:true,checkoutReady:false,financialTransactions:false});
   if(request.method!=='POST'||!['/api/business/checkout','/api/business/payment-webhook'].includes(u.pathname))return fail('not_found',404);
   if(u.pathname==='/api/business/checkout'){
     if(!/application\/json/.test(request.headers.get('content-type')||''))return fail('json_required',415);
     if(Number(request.headers.get('content-length')||0)>2048)return fail('too_large',413);
     let text;try{text=await request.text();if(text.length>2048)return fail('too_large',413);}catch{return fail('invalid_request',400);}
     let input;try{input=checkoutInput(JSON.parse(text));}catch{return fail('invalid_request',400);}
     if(!input)return fail('unsupported_or_sensitive_fields',400);
     if(!env.BUSINESS_AUTH?.verifyMerchantSession||!env.BUSINESS_CATALOG?.getApprovedProduct||!env.PAYMENT_GATEWAY?.createHostedCheckout||!env.PRIVATE_RECEIPTS?.reservePending)return fail('provider_not_connected',503);
     // Verify identity, role, ownership and merchant's legal rights on the server.
     let actor;try{actor=await env.BUSINESS_AUTH.verifyMerchantSession(request);}catch{return fail('merchant_authorization_required',403);}
     if(!actor||!safe(actor.merchantId)||actor.role!=='merchant_admin'||actor.verified!==true||actor.paymentsEnabled!==true)return fail('merchant_authorization_required',403);
     let product;try{product=await env.BUSINESS_CATALOG.getApprovedProduct(actor.merchantId,input.productId);}catch{return fail('catalog_unavailable',503);}
     // A securities offering is not an ordinary online card checkout.
     if(!product||product.issuerAuthorized!==true||product.status!=='active')return fail('offer_not_approved',409);
     if(product.kind==='security'||product.kind==='real_estate_investment')return fail('official_offering_portal_required',409);
     if(product.kind!=='service'||!safe(product.priceId)||!['one_time','subscription'].includes(product.mode)||product.approvedPaymentTerms!==true)return fail('product_not_payable',409);
     // All prices, currency, merchant IDs and recurrence come from an authenticated server catalog.
     let hosted;
     try{hosted=await env.PAYMENT_GATEWAY.createHostedCheckout({merchantId:actor.merchantId,productId:input.productId,priceId:product.priceId,mode:product.mode,idempotencyKey:input.idempotencyKey});}
     catch{return fail('checkout_unavailable',503);}
     if(!hosted||!safe(hosted.checkoutId)||!HTTPS(hosted.url))return fail('invalid_provider_response',502);
     try{await env.PRIVATE_RECEIPTS.reservePending({merchantId:actor.merchantId,productId:input.productId,checkoutId:hosted.checkoutId,idempotencyKey:input.idempotencyKey});}
     catch{return fail('private_ledger_unavailable',503);}
     return json({ok:true,checkoutUrl:hosted.url,checkoutId:hosted.checkoutId,providerHosted:true,noRawPaymentData:true});
   }
   if(!env.PAYMENT_GATEWAY?.verifyWebhook||!env.PRIVATE_RECEIPTS?.applyVerifiedEvent)return fail('provider_not_connected',503);
   // Verify exact raw body, provider signature, timestamp tolerance and anti-replay in adapter.
   const raw=await request.text();
   if(raw.length>65536)return fail('too_large',413);
   let ev;try{ev=await env.PAYMENT_GATEWAY.verifyWebhook(request.headers,raw);}catch{return fail('invalid_webhook_signature',403);}
   const rec=safeReceipt(ev);
   if(!rec)return fail('unsupported_provider_event',400);
   // Implementation contract: applyVerifiedEvent must be atomically idempotent in private D1.
   try{await env.PRIVATE_RECEIPTS.applyVerifiedEvent(rec);}catch{return fail('ledger_unavailable',503);}
   return json({ok:true,received:true});
 }
};
export {checkoutInput,safeReceipt};
