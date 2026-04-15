import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { addDays, format, setHours, setMinutes, parseISO, isAfter } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const dynamic = "force-dynamic";

const TZ = "Europe/Rome";
const SLOT_INTERVAL = 30;

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { service, date } = await req.json();

  const { data: svc } = await db
    .from("services")
    .select("duration_minutes")
    .ilike("name", `%${service}%`)
    .single();

  const duration = svc?.duration_minutes ?? 60;
  const startDate = date ? parseISO(date) : new Date();
  const slots: string[] = [];

  for (let d = 0; d < 3 && slots.length < 6; d++) {
    const day = addDays(startDate, d);
    const dayOfWeek = day.getDay();

    const { data: avail } = await db
      .from("availability")
      .select("open_time, close_time, is_open")
      .eq("day_of_week", dayOfWeek)
      .single();

    if (!avail?.is_open) continue;

    const [openH, openM] = avail.open_time.split(":").map(Number);
    const [closeH, closeM] = avail.close_time.split(":").map(Number);

    const { data: bookings } = await db
      .from("bookings")
      .select("time_slot, duration_minutes")
      .eq("date", format(day, "yyyy-MM-dd"))
      .eq("status", "confirmed");

    let current = setMinutes(setHours(day, openH), openM);
    const close = setMinutes(setHours(day, closeH), closeM);
    const nowRome = toZonedTime(new Date(), TZ);

    while (isAfter(close, current) && slots.length < 6) {
      const slotEnd = new Date(current.getTime() + duration * 60000);
      if (isAfter(slotEnd, close)) break;
      if (isAfter(current, nowRome)) {
        const occupied = bookings?.some((b) => {
          const [bH, bM] = b.time_slot.split(":").map(Number);
          const bStart = setMinutes(setHours(day, bH), bM);
          const bEnd = new Date(bStart.getTime() + b.duration_minutes * 60000);
          return current < bEnd && slotEnd > bStart;
        });
        if (!occupied) {
          slots.push(`${format(day, "EEEE d MMMM")} alle ${format(current, "HH:mm")}`);
        }
      }
      current = new Date(current.getTime() + SLOT_INTERVAL * 60000);
    }
  }

  if (slots.length === 0) {
    return NextResponse.json({ result: "Non ho disponibilità nei prossimi 3 giorni." });
  }

  return NextResponse.json({ result: `Ecco le prime disponibilità: ${slots.slice(0, 4).join(", ")}.` });
}
