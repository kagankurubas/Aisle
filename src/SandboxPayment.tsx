import { useEffect, useRef, useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { getFirebase, subscribeAuth } from './auth';
import { money } from './catalog';
import type { CartLine } from './shop';

const endpoint = 'https://aisle-roan.vercel.app/api/payment';
type Result = {status:'success'|'pending'|'declined';message:string;paymentId?:string;total?:number};
export type SandboxReceipt = {paymentId:string;total:number};
export default function SandboxPayment({cart,express,onVerified}:{cart:CartLine[];express:boolean;onVerified:(receipt:SandboxReceipt)=>void}) {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [session,setSession] = useState<{ticket:string;url:string;uid:string}|null>(null);
  const [result,setResult] = useState<Result|null>(null);
  const request = useRef(false);
  useEffect(()=>{
    let disposed=false;
    let unsubscribe=()=>{};
    subscribeAuth(()=>{ if(!disposed){setSession(null);setResult(null);setError('');} })
      .then(stop=>{if(disposed)stop();else unsubscribe=stop;}).catch(()=>{});
    return ()=>{disposed=true;unsubscribe();};
  },[]);
  async function call(action:string,body:object,expectedUid?:string) {
    const {auth} = await getFirebase();
    const user = auth.currentUser;
    if (!user?.emailVerified || (expectedUid && user.uid !== expectedUid)) throw new Error('Sign in with the same verified account to use this payment session.');
    const token = await user.getIdToken();
    const response = await fetch(`${endpoint}?action=${action}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body),signal:AbortSignal.timeout(28000)});
    const data = await response.json();
    if (auth.currentUser?.uid !== user.uid) throw new Error('Account changed. Start a new payment test.');
    if (!response.ok) throw new Error(data.error || 'Sandbox connection failed.');
    return {data,uid:user.uid};
  }
  async function start() {
    if (request.current) return;
    request.current=true;setBusy(true);setError('');setResult(null);
    // Open from the click gesture; asynchronous popup creation is often blocked.
    const popup = window.open('about:blank','aisle-sandbox-payment');
    if (popup) { popup.opener=null; popup.document.title='Opening iyzico Sandbox…'; }
    try {
      const {data,uid} = await call('start',{lines:cart.map(({id,quantity})=>({id,quantity})),express});
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || !['sandbox-cpp.iyzipay.com','sandbox-merchantgw.iyzipay.com','sandbox-consumerapigw.iyzipay.com'].includes(url.hostname)) throw new Error('Unexpected checkout address.');
      setSession({ticket:data.ticket,url:url.href,uid});
      if (popup) popup.location.replace(url.href);
    } catch(e) { popup?.close();setError(e instanceof Error?e.message:'Could not open sandbox checkout.'); }
    finally {request.current=false;setBusy(false);}
  }
  async function check() {
    if (!session || request.current) return;
    request.current=true;setBusy(true);setError('');
    try {
      const {data} = await call('status',{ticket:session.ticket},session.uid);
      if(data.status === 'success') {
        if(typeof data.paymentId !== 'string' || !data.paymentId || !Number.isSafeInteger(data.total) || data.total <= 0) throw new Error('Incomplete payment confirmation. Please verify again.');
        onVerified({paymentId:data.paymentId,total:data.total});
      } else setResult(data);
    }
    catch(e) {setError(e instanceof Error?e.message:'Could not verify payment.');}
    finally {request.current=false;setBusy(false);}
  }
  return <section className="sandbox-payment" aria-label="iyzico sandbox payment">
    <h4><ShieldCheck size={18}/> iyzico Sandbox</h4>
    <p className="muted">Test the payment provider in a separate tab. Use test cards only. No real charge or shipment. Fictional customer details are sent; your delivery form is not sent.</p>
    <p className="small muted">Verified sign-in required. USD demo prices. A successful test produces a receipt here; your bag stays available and no fulfilment order is created.</p>
    {!session ? <button type="button" className="primary" disabled={busy || !cart.length} onClick={start}>{busy?'Opening sandbox…':'Pay with iyzico test cards'} <ExternalLink size={16}/></button> : <>
      {result?.status !== 'success' && <><p><a href={session.url} target="_blank" rel="noopener noreferrer">Open the test payment screen ↗</a></p><button type="button" className="primary" disabled={busy} onClick={check}>{busy?'Verifying with iyzico…':'Verify payment'}</button></>}
      {result && <div role="status" className="sandbox-receipt"><strong>{result.status==='success'?'Sandbox payment verified':result.status==='declined'?'Test payment declined':'Payment not yet confirmed'}</strong><p>{result.message}</p>{result.paymentId && <p>Provider reference: {result.paymentId}<br/>Verified test total: {money(result.total!)}</p>}</div>}
      {result?.status !== 'success' && <button type="button" className="text-button" disabled={busy} onClick={()=>{setSession(null);setResult(null);setError('');}}>Start a new test</button>}
    </>}
    {error && <p role="alert" className="error">{error}</p>}
  </section>;
}
