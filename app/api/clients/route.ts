import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getSupabaseAdmin();
  const phone = req.nextUrl.searchParams.get("phone");
  const search = req.nextUrl.searchParams.get("search");

  if (phone) {
    const { data } = await db
      .from("clients")
      .select("id, name, phone, notes")
      .eq("phone", phone)
      .maybeSingle();
    return NextResponse.json(data ?? null);
  }

  if (search) {
    const { data } = await db
      .from("clients")
      .select("*, bookings(service, date, time_slot, status)")
      .or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
      .order("created_at", { ascending: false });
    return NextResponse.json(data ?? []);
  }

  const { data } = await db
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { name, phone, email, birthday, skin_type, allergies, notes } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });

  const { data, error } = await db
    .from("clients")
    .insert({
      name: name.trim(),
      phone: phone || null,
      email: email || null,
      birthday: birthday || null,
      skin_type: skin_type || null,
      allergies: allergies || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
