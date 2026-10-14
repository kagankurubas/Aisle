import type { SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | null = null;
const env = import.meta.env;
export const authConfigured = Boolean(
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
export async function getAuth() {
  if (!authConfigured) return null;
  if (!client) {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient(
      env.VITE_SUPABASE_URL!,
      env.VITE_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          flowType: "pkce",
          persistSession: true,
          detectSessionInUrl: true,
        },
      },
    );
  }
  return client;
}
