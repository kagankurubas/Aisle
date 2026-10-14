import { products, productById, type Product } from './catalog.ts';
export type CartLine={id:number;quantity:number};
export function normalizeCart(input:unknown):CartLine[]{
 if(!Array.isArray(input)) return [];
 const map=new Map<number,number>();
 for(const line of input){if(!line || typeof line!=='object')continue;const p=productById(line.id);if(p&&Number.isInteger(line.quantity)&&line.quantity>0)map.set(p.id,Math.min(p.stock,(map.get(p.id)??0)+line.quantity));}
 return [...map].map(([id,quantity])=>({id,quantity}));
}
export function totals(cart:CartLine[],express=false){
 const subtotal=normalizeCart(cart).reduce((s,l)=>s+productById(l.id)!.price*l.quantity,0);
 const shipping=subtotal===0?0:express?1299:subtotal>=7500?0:599;
 return {subtotal,shipping,total:subtotal+shipping};
}
export function comparable(selected:Product[],candidate:Product){return selected.length<3 && (!selected.length || selected.every(p=>p.kind===candidate.kind));}
export function searchCatalog(query:string, category='All', max=200000,sort='featured',saved?:number[]):Product[]{
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const found=products.filter(p=>(category==='All'||p.category===category)&&p.price<=max&&(!saved||saved.includes(p.id))&&terms.every(term=>[p.name,p.brand,p.kind,p.category,...p.tags].join(' ').toLowerCase().includes(term)));
 return [...found].sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:sort==='rating'?b.rating-a.rating:0);
}
export function differences(items:Product[],only=false){
 const keys=[...new Set(items.flatMap(p=>Object.keys(p.specs)))];
 return keys.filter(key=>!only||new Set(items.map(p=>p.specs[key]??'—')).size>1);
}
export type DemoOrder={id:string;date:string;lines:CartLine[];total:number;status:'Confirmed'|'Cancelled';shipping:number};
