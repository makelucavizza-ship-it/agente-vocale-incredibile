import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client browser (dashboard — solo lettura sicura)
export const supabase = createClient(url, anon);

// Client server (API routes — accesso completo)
export const supabaseAdmin = createClient(url, serviceRole);
