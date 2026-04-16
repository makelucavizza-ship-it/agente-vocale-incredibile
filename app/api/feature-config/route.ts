import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getSupabaseAdmin();
  const { data } = await db.from("feature_config").select("key, config");
  const result = Object.fromEntries((data ?? []).map(r => [r.key, r.config]));
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { key, config } = await req.json();
  const { error } = await db.from("feature_config")
    .upsert({ key, config, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
