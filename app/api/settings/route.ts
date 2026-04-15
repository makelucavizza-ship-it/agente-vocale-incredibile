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
