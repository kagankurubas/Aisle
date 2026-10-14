import type {SupabaseClient} from '@supabase/supabase-js';
let client:SupabaseClient|null=null;
const env=import.meta as ImportMeta & {env:Record<string,string|undefined>};
export const authConfigured=Boolean(env.env.VITE_SUPABASE_URL&&env.env.VITE_SUPABASE_PUBLISHABLE_KEY);
export async function getAuth(){
 if(!authConfigured) return null;
 if(!client){const {createClient}=await import('@supabase/supabase-js');client=createClient(env.env.VITE_SUPABASE_URL!,env.env.VITE_SUPABASE_PUBLISHABLE_KEY!,{auth:{flowType:'pkce',persistSession:true,detectSessionInUrl:true}});}
 return client;
}
