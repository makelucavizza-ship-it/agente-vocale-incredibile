import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getSupabaseAdmin();
  const { data } = await db.from("closures").select("*").order("date");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { date, reason } = await req.json();
  if (!date) return NextResponse.json({ error: "Data mancante" }, { status: 400 });
  const { data, error } = await db.from("closures")
    .upsert({ date, reason: reason || null }, { onConflict: "date" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const db = getSupabaseAdmin();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  await db.from("closures").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
