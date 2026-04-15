import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST — crea prenotazione (chiamato dall'agente vocale)
export async function POST(req: NextRequest) {
  const { client_name, client_phone, service, date, time_slot } = await req.json();

  if (!client_name || !service || !date || !time_slot) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  // Trova o crea cliente
  let clientId: string;
  const { data: existing } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("phone", client_phone ?? "")
    .maybeSingle();

  if (existing) {
    clientId = existing.id;
  } else {
    const { data: newClient, error } = await supabaseAdmin
      .from("clients")
      .insert({ name: client_name, phone: client_phone ?? null })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clientId = newClient.id;
  }

  // Recupera durata servizio
  const { data: svc } = await supabaseAdmin
    .from("services")
    .select("duration_minutes")
    .ilike("name", `%${service}%`)
    .maybeSingle();

  const { data: booking, error } = await supabaseAdmin
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
    result: `Prenotazione confermata. ID: ${booking.id}. ${client_name} il ${date} alle ${time_slot} per ${service}.`,
    booking_id: booking.id,
  });
}

// GET — lista prenotazioni (dashboard)
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  let query = supabaseAdmin
    .from("bookings")
    .select("*, clients(name, phone)")
    .order("time_slot");

  if (date) query = query.eq("date", date);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
