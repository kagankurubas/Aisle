import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomUUID, timingSafeEqual, verify } from 'node:crypto';
import catalog from './catalog.json' with { type: 'json' };

export class PaymentError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const reject = (message, status) => { throw new PaymentError(message, status); };
export const BASE = 'https://sandbox-api.iyzipay.com';
export function configuration() {
  const apiKey = process.env.IYZICO_SANDBOX_API_KEY;
  const secret = process.env.IYZICO_SANDBOX_SECRET_KEY;
  const stateKey = process.env.PAYMENT_SESSION_KEY;
  // Intentionally cannot be switched to a live payment endpoint.
  if (!apiKey?.startsWith('sandbox-') || !secret?.startsWith('sandbox-') || !/^[a-f0-9]{64}$/i.test(stateKey || ''))
    reject('Sandbox payment is not configured yet.', 503);
  return { apiKey, secret, stateKey };
}
export function quote(lines, express) {
  if (!Array.isArray(lines) || !lines.length || lines.length > catalog.length || typeof express !== 'boolean') reject('Invalid bag.');
  const seen = new Set();
  const items = lines.map(line => {
    const p = catalog.find(p => p.id === line?.id);
    if (!p || seen.has(p.id) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > p.stock) reject('Invalid product or quantity.');
    seen.add(p.id);
    if (Object.keys(line).some(k => !['id','quantity'].includes(k))) reject('Send product IDs and quantities only.');
    return { id: String(p.id), name: p.name, category1: p.category, itemType: 'PHYSICAL', price: ((p.price * line.quantity) / 100).toFixed(2) };
  });
  const subtotal = items.reduce((sum, item) => sum + Math.round(Number(item.price) * 100), 0);
  const shipping = express ? 1299 : subtotal >= 7500 ? 0 : 599;
  if (shipping) items.push({id:'delivery',name:'Demo delivery',category1:'Delivery',itemType:'VIRTUAL',price:(shipping/100).toFixed(2)});
  return { items, total: subtotal + shipping, shipping };
}
export function seal(data, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(data)),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url');
}
export function unseal(ticket, key, uid, now = Date.now()) {
  try {
    if (typeof ticket !== 'string' || ticket.length > 8000) throw Error();
    const bytes = Buffer.from(ticket,'base64url');
    const decipher = createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),bytes.subarray(0,12));
    decipher.setAuthTag(bytes.subarray(12,28));
    const data = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString());
    if (data.uid !== uid || !Number.isFinite(data.exp) || data.exp <= now) throw Error();
    return data;
  } catch { reject('Payment session expired or belongs to another account.', 403); }
}
export function signature(fields, secret) {
  return createHmac('sha256',secret).update(fields.map(String).join(':')).digest('hex');
}
export function checkSignature(fields, actual, secret) {
  const expected = signature(fields,secret);
  if (typeof actual !== 'string' || !/^[a-f0-9]{64}$/i.test(actual) || !timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(actual,'hex')))
    reject('Payment provider verification failed.', 502);
}
export function authorization(path, body, {apiKey,secret}, random = randomBytes(16).toString('hex')) {
  const hash = createHmac('sha256',secret).update(random + path + body).digest('hex');
  return { Authorization: 'IYZWSv2 ' + Buffer.from(`apiKey:${apiKey}&randomKey:${random}&signature:${hash}`).toString('base64'), 'x-iyzi-rnd': random, 'Content-Type':'application/json' };
}
export async function provider(path, payload, config, fetcher = fetch) {
  const body = JSON.stringify(payload);
  const response = await fetcher(BASE + path, {method:'POST',headers:authorization(path,body,config),body,signal:AbortSignal.timeout(18000)});
  if (!response.ok) reject('Sandbox provider is unavailable. Please retry.',502);
  return response.json();
}
let certCache = { expires:0, certs:{} };
export function verifyClaims(token, certs, project, now = Math.floor(Date.now()/1000)) {
  try {
    if (typeof token !== 'string' || token.length > 12000 || !/^[a-z0-9-]+$/.test(project)) throw Error();
    const parts = token.split('.');
    if (parts.length !== 3) throw Error();
    const head = JSON.parse(Buffer.from(parts[0],'base64url'));
    const claims = JSON.parse(Buffer.from(parts[1],'base64url'));
    if (head.alg !== 'RS256' || !Object.hasOwn(certs,head.kid)) throw Error();
    if (!verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),certs[head.kid],Buffer.from(parts[2],'base64url'))) throw Error();
    if (claims.aud !== project || claims.iss !== `https://securetoken.google.com/${project}` || typeof claims.sub !== 'string' || !claims.sub.length || claims.sub.length > 128 || !Number.isFinite(claims.exp) || claims.exp <= now || !Number.isFinite(claims.iat) || claims.iat > now || !Number.isFinite(claims.auth_time) || claims.auth_time > now || claims.email_verified !== true) throw Error();
    return claims.sub;
  } catch { reject('Sign in with a verified account to use sandbox payments.',401); }
}
export async function authenticate(header) {
  const project = process.env.FIREBASE_PROJECT_ID || 'aisle-4f23e';
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) reject('Sign in to use sandbox payments.',401);
  if (certCache.expires <= Date.now()) {
    const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',{signal:AbortSignal.timeout(8000)});
    if (!response.ok) reject('Account verification unavailable.',503);
    const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 300);
    certCache = {expires:Date.now()+Math.min(maxAge,3600)*1000,certs:await response.json()};
  }
  return verifyClaims(header.slice(7),certCache.certs,project);
}
export async function startPayment(uid, lines, express, config, fetcher = fetch, mode = 'bag') {
  if (!['bag','error-test'].includes(mode)) reject('Invalid sandbox mode.');
  const diagnostic = mode === 'error-test';
  const currency = diagnostic ? 'TRY' : 'USD';
  const sum = diagnostic
    ? {total:100,shipping:0,items:[{id:'diagnostic',name:'Sandbox error test - not a store order',category1:'Test',itemType:'VIRTUAL',price:'1.00'}]}
    : quote(lines,express);
  const id = 'AISLE-' + randomUUID();
  // Sandbox fixture only: never request identity numbers or real delivery data.
  const address = {contactName:'Demo Shopper',city:'Istanbul',country:'Turkey',address:'Example Street 1',zipCode:'34000'};
  const payload = {
    locale:'en', conversationId:id,basketId:id,price:(sum.total/100).toFixed(2),paidPrice:(sum.total/100).toFixed(2),currency,paymentGroup:'PRODUCT',enabledInstallments:[1],
    callbackUrl:'https://aisle-roan.vercel.app/api/payment?action=callback',
    buyer:{id,name:'Demo',surname:'Shopper',identityNumber:'74300864791',email:'demo@example.com',gsmNumber:'+905350000000',registrationAddress:address.address,city:address.city,country:address.country,zipCode:address.zipCode,ip:'127.0.0.1'},
    shippingAddress:address,billingAddress:address,basketItems:sum.items,
  };
  const result = await provider('/payment/iyzipos/checkoutform/initialize/auth/ecom',payload,config,fetcher);
  if (result.status !== 'success') reject('Sandbox checkout could not be started. Check merchant credentials and USD support.',502);
  if (result.conversationId !== id || typeof result.token !== 'string') reject('Payment session verification failed.',502);
  checkSignature([result.conversationId,result.token],result.signature,config.secret);
  const url = new URL(result.paymentPageUrl);
  if (url.protocol !== 'https:' || !['sandbox-cpp.iyzipay.com','sandbox-merchantgw.iyzipay.com','sandbox-consumerapigw.iyzipay.com'].includes(url.hostname)) reject('Unexpected payment page address.',502);
  const ticket = seal({uid,id,token:result.token,total:sum.total,shipping:sum.shipping,currency,mode,lines:diagnostic ? [] : lines.map(({id,quantity})=>({id,quantity})),exp:Date.now()+30*60*1000},config.stateKey);
  return {url:url.href,ticket,total:sum.total,currency,mode};
}
export function verifiedResult(result, session, secret) {
  if (result.status !== 'success') return {status:'pending',message:'Payment has not completed. Finish the iyzico test screen, then check again.'};
  checkSignature([result.paymentStatus,result.paymentId,result.currency,result.basketId,result.conversationId,String(Number(result.paidPrice)),String(Number(result.price)),result.token],result.signature,secret);
  if (result.token !== session.token || result.basketId !== session.id || result.conversationId !== session.id || result.currency !== (session.currency || 'USD') || Math.round(Number(result.price)*100) !== session.total || Math.round(Number(result.paidPrice)*100) !== session.total) reject('Payment details did not match this test session.',502);
  if (result.paymentStatus === 'FAILURE') return {status:'declined',message:'Sandbox payment was declined. Your bag is unchanged.'};
  if (result.paymentStatus !== 'SUCCESS' || Number(result.fraudStatus) !== 1) return {status:'pending',message:'Sandbox payment is awaiting approval. Your bag is unchanged.'};
  if (!result.paymentId) reject('Missing payment reference.',502);
  return {status:'success',id:session.id,paymentId:String(result.paymentId),total:session.total,currency:session.currency || 'USD',mode:session.mode || 'bag',lines:session.lines || [],message:session.mode === 'error-test' ? 'The separate TRY 1.00 diagnostic completed successfully. This is not a payment for your bag. No real charge or shipment.' : 'Verified with iyzico Sandbox. No real charge or shipment.'};
}
export async function paymentStatus(uid,ticket,config,fetcher = fetch) {
  const session = unseal(ticket,config.stateKey,uid);
  const result = await provider('/payment/iyzipos/checkoutform/auth/ecom/detail',{locale:'en',conversationId:session.id,token:session.token},config,fetcher);
  return verifiedResult(result,session,config.secret);
}
