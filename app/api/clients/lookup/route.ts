import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST invece di GET per evitare che il numero di telefono appaia nei log del server
export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { phone } = await req.json();
  if (!phone) return NextResponse.json(null);

  const { data } = await db
    .from("clients")
    .select("id, name, phone, notes, skin_type, allergies")
    .eq("phone", phone)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}
