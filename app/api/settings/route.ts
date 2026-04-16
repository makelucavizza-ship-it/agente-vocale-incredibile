import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { type, data } = await req.json();

  if (type === "availability") {
    const { day_of_week, open_time, close_time, is_open } = data;
    const { error } = await db.from("availability")
      .update({ open_time, close_time, is_open })
      .eq("day_of_week", day_of_week);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (type === "service") {
    const { id, name, duration_minutes, price, active } = data;
    const { error } = await db.from("services")
      .update({ name, duration_minutes, price, active })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { type, data } = await req.json();

  if (type === "service") {
    const { name, duration_minutes, price } = data;
    if (!name) return NextResponse.json({ error: "Nome mancante" }, { status: 400 });
    const { data: svc, error } = await db.from("services")
      .insert({ name, duration_minutes: duration_minutes ?? 60, price: price ?? 0, active: true })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(svc);
  }

  return NextResponse.json({ error: "Tipo non supportato" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { type, id } = await req.json();

  if (type === "service") {
    const { error } = await db.from("services").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Tipo non supportato" }, { status: 400 });
}
