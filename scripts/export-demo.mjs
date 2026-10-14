import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const destination=process.argv[2];
if(!destination||!path.isAbsolute(destination))throw new Error('Provide an absolute output HTML path');
const images={};
for(const id of [99,100,101,103,104,105,107,108,78,79,80,82])images[id]=`data:image/webp;base64,${(await readFile(`public/products/${id}.webp`)).toString('base64')}`;
const result=await build({entryPoints:['src/main.tsx'],bundle:true,write:false,outdir:'demo',format:'iife',minify:true,target:'es2022',define:{'import.meta.env':JSON.stringify({BASE_URL:'/',VITE_SUPABASE_URL:'',VITE_SUPABASE_PUBLISHABLE_KEY:''}),'process.env.NODE_ENV':'"production"'},preserveSymlinks:true,plugins:[{name:'inline-demo-assets',setup(b){b.onLoad({filter:/catalog\.ts$/},async args=>{const source=await readFile(args.path,'utf8');const updated=source.replace(/`\$\{import.meta.env.BASE_URL\}products\/\$\{p.id\}\.webp`/, '__aisleImages[p.id]');if(updated===source)throw new Error('Catalog image path changed; update export matcher');return {contents:`const __aisleImages:Record<number,string>=${JSON.stringify(images)};\n${updated}`,loader:'ts'};});b.onResolve({filter:/^\/fonts\//},args=>({path:args.path,external:true}));}}]});
let css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
for(const match of [...css.matchAll(/url\(([^)]+)\)/g)]){const url=match[1].replace(/["']/g,'');if(url.startsWith('/fonts/'))css=css.replace(match[0],`url(data:font/ttf;base64,${(await readFile('public'+url)).toString('base64')})`);}
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Aisle self-contained shopping demo"><title>Aisle — Interactive demo</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination,html);console.log(`Self-contained demo exported (${Math.round(Buffer.byteLength(html)/1024)} KB).`);
