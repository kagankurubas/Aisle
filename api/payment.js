import { authenticate, configuration, startPayment, paymentStatus, PaymentError } from '../server/payment.js';

const origins = new Set(['https://aisle-roan.vercel.app','https://kagankurubas.github.io']);
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  const action = new URL(req.url,'https://aisle-roan.vercel.app').searchParams.get('action');
  // Public callback carries no authority. Only an authenticated server-side retrieve
  // can confirm payment; callback body/query is never treated as a paid order.
  if (action === 'callback' && ['POST','GET'].includes(req.method)) {
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
    return res.status(200).send('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aisle sandbox checkout</title><body style="font:18px system-ui;padding:48px;line-height:1.7;background:#f8f7f1;color:#234b3b"><h1>Return to Aisle.</h1><p>The test payment screen has finished. Close this tab and choose <strong>Confirm test payment</strong> in Aisle to check the result securely.</p><p>No real charge or shipment.</p></body></html>');
  }
  const origin = req.headers.origin;
  if (!origins.has(origin)) return res.status(403).json({error:'This origin is not allowed.'});
  res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({error:'Use POST.'});
  try {
    if (!['start','status'].includes(action)) throw new PaymentError('Unknown payment action.',404);
    if (!String(req.headers['content-type']).startsWith('application/json')) throw new PaymentError('Use JSON.',415);
    let body;
    let raw;
    // Vercel exposes body through a lazy JSON getter, which can itself throw.
    try {
      const incoming = req.body;
      raw = typeof incoming === 'string' ? incoming : JSON.stringify(incoming ?? null);
      body = typeof incoming === 'string' ? JSON.parse(incoming) : incoming;
    }
    catch { throw new PaymentError('Invalid JSON.',400); }
    if (Buffer.byteLength(raw) > 16000) throw new PaymentError('Request too large.',413);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PaymentError('Use a JSON object.',400);
    const uid = await authenticate(req.headers.authorization);
    const config = configuration();
    if (action === 'start') return res.status(200).json(await startPayment(uid,body?.lines,body?.express,config,fetch,body?.mode ?? 'bag'));
    if (action === 'status') return res.status(200).json(await paymentStatus(uid,body?.ticket,config));
    throw new PaymentError('Unknown payment action.',404);
  } catch (error) {
    // Never log request bodies, bearer tokens, provider credentials or card data.
    return res.status(error instanceof PaymentError ? error.status : 502).json({error:error instanceof PaymentError ? error.message : 'Sandbox connection failed. Please try again.'});
  }
}

