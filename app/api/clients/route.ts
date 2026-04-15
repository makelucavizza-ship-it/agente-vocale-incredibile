import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase";

// GET — cerca cliente per telefono (chiamato dall'agente)
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  const search = req.nextUrl.searchParams.get("search");

  if (phone) {
    const { data } = await supabaseAdmin
      .from("clients")
      .select("id, name, phone, notes")
      .eq("phone", phone)
      .maybeSingle();
    return NextResponse.json(data ?? null);
  }

  if (search) {
    const { data } = await supabaseAdmin
      .from("clients")
      .select("*, bookings(service, date, time_slot, status)")
      .or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
      .order("created_at", { ascending: false });
    return NextResponse.json(data ?? []);
  }

  const { data } = await supabaseAdmin
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}
