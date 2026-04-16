import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getSupabaseAdmin();
  const { data } = await db.from("waitlist")
    .select("*")
    .eq("status", "waiting")
    .order("created_at");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { client_name, client_phone, service, preferred_date, notes } = await req.json();
  if (!client_name || !service) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }
  const { data, error } = await db.from("waitlist")
    .insert({ client_name, client_phone, service, preferred_date: preferred_date || null, notes })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const db = getSupabaseAdmin();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  await db.from("waitlist").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
