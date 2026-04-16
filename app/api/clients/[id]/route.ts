import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getSupabaseAdmin();
  const { id } = await params;
  const { data } = await db.from("clients")
    .select("*, bookings(id, service, date, time_slot, status, source)")
    .eq("id", id)
    .single();
  return NextResponse.json(data ?? null);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getSupabaseAdmin();
  const { id } = await params;
  const { name, phone, email, notes, skin_type, allergies, birthday } = await req.json();
  const { error } = await db.from("clients")
    .update({ name, phone, email, notes, skin_type, allergies, birthday: birthday || null })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
