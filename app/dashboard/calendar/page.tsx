import { getSupabaseAdmin } from "@/lib/supabase";
import { format, startOfWeek, addDays, addWeeks, subWeeks, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import NewBookingModal from "../components/NewBookingModal";

export const dynamic = "force-dynamic";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

const SERVICE_COLORS: Record<string, string> = {
  default: "bg-violet-100 text-violet-800 border-violet-200",
  pulizia: "bg-rose-100 text-rose-800 border-rose-200",
  massaggio: "bg-blue-100 text-blue-800 border-blue-200",
  manicure: "bg-pink-100 text-pink-800 border-pink-200",
  ceretta: "bg-amber-100 text-amber-800 border-amber-200",
  pedicure: "bg-teal-100 text-teal-800 border-teal-200",
};

function colorForService(service: string) {
  const s = service.toLowerCase();
  for (const key of Object.keys(SERVICE_COLORS)) {
    if (s.includes(key)) return SERVICE_COLORS[key];
  }
  return SERVICE_COLORS.default;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const db = getSupabaseAdmin();
  const { week } = await searchParams;
  const baseDate = week ? parseISO(week) : new Date();
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  const today = format(new Date(), "yyyy-MM-dd");

  const from = format(weekStart, "yyyy-MM-dd");
  const to = format(addDays(weekStart, 5), "yyyy-MM-dd");
  const prevWeek = format(subWeeks(weekStart, 1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(weekStart, 1), "yyyy-MM-dd");

  const [{ data: bookings }, { data: services }] = await Promise.all([
    db.from("bookings").select("*, clients(name)")
      .gte("date", from).lte("date", to).eq("status", "confirmed"),
    db.from("services").select("*").eq("active", true).order("name"),
  ]);

  function bookingsForDayHour(day: Date, hour: number) {
    const dateStr = format(day, "yyyy-MM-dd");
    return bookings?.filter(b => {
      const [h] = b.time_slot.split(":").map(Number);
      return b.date === dateStr && h === hour;
    }) ?? [];
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-gray-900">Calendario</h1>
          <div className="flex items-center gap-1">
            <Link href={`/dashboard/calendar?week=${prevWeek}`}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-sm">‹</Link>
            <span className="text-sm text-gray-500 px-2 capitalize">
              {format(weekStart, "d MMM", { locale: it })} – {format(addDays(weekStart, 5), "d MMM yyyy", { locale: it })}
            </span>
            <Link href={`/dashboard/calendar?week=${nextWeek}`}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-sm">›</Link>
          </div>
          <Link href="/dashboard/calendar"
            className="text-xs text-violet-600 hover:text-violet-800">Oggi</Link>
        </div>
        <NewBookingModal services={services ?? []} />
      </div>

      <div className="overflow-x-auto">
      <div className="min-w-[560px] bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          <div className="py-3 px-2 text-xs text-gray-400" />
          {days.map(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isToday = dateStr === today;
            return (
              <div key={dateStr} className={`py-3 px-2 text-center border-l border-gray-100 ${isToday ? "bg-violet-50" : ""}`}>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{format(day, "EEE", { locale: it })}</p>
                <p className={`text-sm font-semibold mt-0.5 ${isToday ? "text-violet-600" : "text-gray-900"}`}>
                  {format(day, "d")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="overflow-y-auto max-h-[600px]">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-7 border-b border-gray-100 min-h-[60px]">
              <div className="py-2 px-2 text-xs text-gray-300 text-right pr-3 pt-2">
                {String(hour).padStart(2, "0")}:00
              </div>
              {days.map(day => {
                const slots = bookingsForDayHour(day, hour);
                return (
                  <div key={day.toISOString()} className="border-l border-gray-100 p-1">
                    {slots.map(b => (
                      <div key={b.id} className={`text-xs rounded px-1.5 py-1 mb-1 border ${colorForService(b.service)}`}>
                        <p className="font-medium truncate">{(b.clients as { name: string } | null)?.name ?? "—"}</p>
                        <p className="truncate opacity-70">{b.service}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
