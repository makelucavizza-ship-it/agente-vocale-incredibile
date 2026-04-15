import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { client_name, client_phone, service, date, time_slot } = await req.json();

  if (!client_name || !service || !date || !time_slot) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  let clientId: string;
  const { data: existing } = await db
    .from("clients")
    .select("id")
    .eq("phone", client_phone ?? "")
    .maybeSingle();

  if (existing) {
    clientId = existing.id;
  } else {
    const { data: newClient, error } = await db
      .from("clients")
      .insert({ name: client_name, phone: client_phone ?? null })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clientId = newClient.id;
  }

  const { data: svc } = await db
    .from("services")
    .select("duration_minutes")
    .ilike("name", `%${service}%`)
    .maybeSingle();

  const { data: booking, error } = await db
    .from("bookings")
    .insert({
      client_id: clientId,
      service,
      date,
      time_slot,
      duration_minutes: svc?.duration_minutes ?? 60,
      source: "phone",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    result: `Prenotazione confermata. ${client_name} il ${date} alle ${time_slot} per ${service}.`,
    booking_id: booking.id,
  });
}

export async function GET(req: NextRequest) {
  const db = getSupabaseAdmin();
  const date = req.nextUrl.searchParams.get("date");

  let query = db
    .from("bookings")
    .select("*, clients(name, phone)")
    .order("time_slot");

  if (date) query = query.eq("date", date);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
