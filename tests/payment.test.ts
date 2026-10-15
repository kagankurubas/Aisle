import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
// @ts-ignore Node executes the server ESM directly.
import {quote,seal,unseal,signature,verifiedResult,verifyClaims,authorization,startPayment,BASE} from '../server/payment.js';
import snapshot from '../server/catalog.json' with {type:'json'};
import {products} from '../src/catalog.ts';
import {subtractPurchased} from '../src/shop.ts';
// @ts-ignore Server ESM is executed by Node.
import handler from '../api/payment.js';

const key='ab'.repeat(32), secret='sandbox-fixture-secret';
test('server catalog matches storefront; server refuses prices and invalid stock',()=>{
  assert.deepEqual(snapshot,products.map(({id,name,category,price,stock})=>({id,name,category,price,stock})));
  assert.equal(quote([{id:100,quantity:2}],false).total,25800);
  for(const lines of [[{id:100,quantity:1,price:1}],[{id:100,quantity:25}],[{id:100,quantity:-1}],[{id:100,quantity:1.2}],[{id:999,quantity:1}],[{id:100,quantity:1},{id:100,quantity:1}],[]]) assert.throws(()=>quote(lines,false));
});
test('encrypted payment sessions cannot be altered, expired, or read by another account',()=>{
  const ticket=seal({uid:'alice',exp:2000,token:'private-provider-token'},key);
  assert.ok(!ticket.includes('private-provider-token'));
  assert.equal(unseal(ticket,key,'alice',1000).uid,'alice');
  assert.throws(()=>unseal(ticket,key,'bob',1000));
  assert.throws(()=>unseal(ticket,key,'alice',2000));
  const altered=Buffer.from(ticket,'base64url');
  altered[altered.length-1] ^= 1;
  assert.throws(()=>unseal(altered.toString('base64url'),key,'alice',1000));
});
test('result requires valid provider signature, basket, currency, amount and approved fraud status',()=>{
  const session={id:'basket-1',token:'token-1',total:12900};
  const good={status:'success',paymentStatus:'SUCCESS',paymentId:'123',currency:'USD',basketId:'basket-1',conversationId:'basket-1',paidPrice:129,price:129,token:'token-1',fraudStatus:1};
  const signed=(r:typeof good)=>({...r,signature:signature([r.paymentStatus,r.paymentId,r.currency,r.basketId,r.conversationId,String(Number(r.paidPrice)),String(Number(r.price)),r.token],secret)});
  assert.equal(verifiedResult(signed(good),session,secret).status,'success');
  assert.throws(()=>verifiedResult({...signed(good),paidPrice:1},session,secret));
  assert.throws(()=>verifiedResult(signed({...good,basketId:'another'}),session,secret));
  assert.throws(()=>verifiedResult(signed({...good,price:1}),session,secret));
  assert.equal(verifiedResult(signed({...good,fraudStatus:0}),session,secret).status,'pending');
  assert.equal(verifiedResult(signed({...good,paymentStatus:'FAILURE'}),session,secret).status,'declined');
  assert.equal(verifiedResult({status:'failure'},session,secret).status,'pending');
});
test('Firebase JWT verification rejects forged signatures, wrong project, expiry and unverified users',()=>{
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const certs={fixture:publicKey};
  const claims={sub:'alice',aud:'aisle-4f23e',iss:'https://securetoken.google.com/aisle-4f23e',iat:100,auth_time:100,exp:200,email_verified:true};
  function jwt(c:object){const base=[{alg:'RS256',kid:'fixture'},c].map(p=>Buffer.from(JSON.stringify(p)).toString('base64url')).join('.');return base+'.'+sign('RSA-SHA256',Buffer.from(base),privateKey).toString('base64url');}
  assert.equal(verifyClaims(jwt(claims),certs,'aisle-4f23e',150),'alice');
  for(const changed of [{...claims,email_verified:false},{...claims,aud:'other'},{...claims,exp:150},{...claims,iat:200}]) assert.throws(()=>verifyClaims(jwt(changed),certs,'aisle-4f23e',150));
  const valid=jwt(claims);assert.throws(()=>verifyClaims(valid.slice(0,-10)+'AAAAAAAAAA',certs,'aisle-4f23e',150));
});
test('iyzico requests sign the exact path and body and only use sandbox',async()=>{
  const config={apiKey:'sandbox-fixture',secret,stateKey:key};
  const h=authorization('/path','{}',config,'random');
  const auth=Buffer.from(h.Authorization.slice(8),'base64').toString();
  assert.ok(auth.startsWith('apiKey:sandbox-fixture&randomKey:random&signature:'));
  let calls=0;
  const fakeFetch=async(url:string,options:{body:string})=>{
    calls++;assert.ok(url.startsWith(BASE+'/'));
    const body=JSON.parse(options.body);
    assert.equal(body.price,'129.00');assert.equal(body.buyer.email,'demo@example.com');
    return {ok:true,json:async()=>({status:'success',conversationId:body.conversationId,token:'fixture-token',signature:signature([body.conversationId,'fixture-token'],secret),paymentPageUrl:'https://sandbox-cpp.iyzipay.com/test'})};
  };
  const result=await startPayment('alice',[{id:100,quantity:1}],false,config,fakeFetch);
  assert.equal(calls,1);assert.equal(result.total,12900);assert.equal(unseal(result.ticket,key,'alice').token,'fixture-token');
});
test('API refuses foreign origins and unsafe methods; callback never claims payment success',async()=>{
  function response(){return {code:0,headers:{} as Record<string,string>,body:null as any,setHeader(k:string,v:string){this.headers[k]=v;},status(c:number){this.code=c;return this;},json(body:any){this.body=body;return this;},send(body:any){this.body=body;return this;},end(){return this;}};}
  let res=response();
  await handler({url:'/api/payment?action=start',method:'POST',headers:{origin:'https://evil.example'}},res);assert.equal(res.code,403);
  res=response();await handler({url:'/api/payment?action=start',method:'GET',headers:{origin:'https://kagankurubas.github.io'}},res);assert.equal(res.code,405);
  res=response();await handler({url:'/api/payment?action=status',method:'OPTIONS',headers:{origin:'https://kagankurubas.github.io'}},res);assert.equal(res.code,204);assert.equal(res.headers['Access-Control-Allow-Origin'],'https://kagankurubas.github.io');
  res=response();await handler({url:'/api/payment?action=callback',method:'POST',headers:{},body:{paymentStatus:'SUCCESS'}},res);assert.equal(res.code,200);assert.ok(!res.body.includes('payment verified'));assert.ok(res.body.includes('Confirm test payment'));
});
test('TRY error diagnostic is a fixed separate amount and cannot confirm a USD bag',async()=>{
  const config={apiKey:'sandbox-fixture',secret,stateKey:key};
  const fakeFetch=async(_url:string,options:{body:string})=>{
    const body=JSON.parse(options.body);
    assert.equal(body.currency,'TRY');assert.equal(body.price,'1.00');assert.equal(body.paidPrice,'1.00');
    assert.equal(body.basketItems.length,1);assert.equal(body.basketItems[0].id,'diagnostic');
    return {ok:true,json:async()=>({status:'success',conversationId:body.conversationId,token:'diagnostic-token',signature:signature([body.conversationId,'diagnostic-token'],secret),paymentPageUrl:'https://sandbox-cpp.iyzipay.com/test'})};
  };
  const result=await startPayment('alice',[{id:100,quantity:2}],true,config,fakeFetch,'error-test');
  assert.equal(result.total,100);assert.equal(result.currency,'TRY');
  const session=unseal(result.ticket,key,'alice');assert.equal(session.mode,'error-test');assert.equal(session.currency,'TRY');
  const response={status:'success',paymentStatus:'SUCCESS',paymentId:'123',currency:'TRY',basketId:session.id,conversationId:session.id,paidPrice:1,price:1,token:session.token,fraudStatus:1};
  const signed={...response,signature:signature([response.paymentStatus,response.paymentId,response.currency,response.basketId,response.conversationId,'1','1',response.token],secret)};
  assert.equal(verifiedResult(signed,session,secret).mode,'error-test');
  assert.throws(()=>verifiedResult(signed,{...session,currency:'USD'},secret));
  await assert.rejects(startPayment('alice',[],false,config,fakeFetch,'live'));
});
test('API rejects malformed JSON and anonymous requests before consulting payment credentials',async()=>{
  function response(){return {code:0,body:null as any,setHeader(){},status(code:number){this.code=code;return this;},json(body:any){this.body=body;return this;},end(){return this;}};}
  const headers={origin:'https://kagankurubas.github.io','content-type':'application/json'};
  for(const [body,expected] of [['{broken',400],['[]',400],['null',400],['{}',401]] as const){
    const res=response();await handler({url:'/api/payment?action=start',method:'POST',headers,body},res);assert.equal(res.code,expected);
  }
  const res=response();await handler({url:'/api/payment?action=start',method:'POST',headers,body:JSON.stringify({ticket:'x'.repeat(16000)})},res);assert.equal(res.code,413);
  const lazy=response();
  await handler({url:'/api/payment?action=start',method:'POST',headers,get body(){throw new SyntaxError('Invalid platform JSON');}},lazy);
  assert.equal(lazy.code,400);
});
test('paid quantities are removed without clearing later additions or unrelated products',()=>{
  assert.deepEqual(subtractPurchased([{id:100,quantity:2}],[{id:100,quantity:2}]),[]);
  assert.deepEqual(subtractPurchased([{id:100,quantity:3},{id:101,quantity:1}],[{id:100,quantity:2}]),[{id:100,quantity:1},{id:101,quantity:1}]);
  assert.deepEqual(subtractPurchased([{id:101,quantity:1}],[{id:100,quantity:2}]),[{id:101,quantity:1}]);
  assert.deepEqual(subtractPurchased([{id:100,quantity:1}],[{id:100,quantity:2}]),[]);
});

