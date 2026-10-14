import {mkdir,writeFile} from 'node:fs/promises';
const categories=['mobile-accessories','laptops'];
const ids=new Set([99,100,101,103,104,105,107,108,78,79,80,82]);
await mkdir('public/products',{recursive:true});
const sources=[];
for(const category of categories){
 const response=await fetch(`https://dummyjson.com/products/category/${category}`);
 if(!response.ok)throw new Error(`Catalog request failed: ${response.status}`);
 for(const product of (await response.json()).products.filter(p=>ids.has(p.id))){
  const image=await fetch(product.thumbnail);
  if(!image.ok)throw new Error(`Image request failed: ${product.id}`);
  await writeFile(`public/products/${product.id}.webp`,Buffer.from(await image.arrayBuffer()));
  sources.push({id:product.id,title:product.title,source:product.thumbnail});
 }
}
await writeFile('recon/ASSET-SOURCES.json',JSON.stringify(sources,null,2));
console.log(`Saved ${sources.length} product images locally.`);
