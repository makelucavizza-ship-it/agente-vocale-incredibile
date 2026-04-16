import { getSupabaseAdmin } from "@/lib/supabase";
import { format, subDays, subMonths, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const db = getSupabaseAdmin();
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const twelveMonthsAgo = format(subMonths(new Date(), 11), "yyyy-MM-dd");

  const [
    { data: todayBookings },
    { data: recentBookings },
    { data: allBookings },
    { data: services },
    { data: availability },
  ] = await Promise.all([
    db.from("bookings").select("service, duration_minutes").eq("date", today).eq("status", "confirmed"),
    db.from("bookings").select("service").gte("date", thirtyDaysAgo).eq("status", "confirmed"),
    db.from("bookings").select("date").gte("date", twelveMonthsAgo).eq("status", "confirmed"),
    db.from("services").select("name, duration_minutes, price").eq("active", true),
    db.from("availability").select("*"),
  ]);

  // --- Efficienza oggi ---
  const todayDow = new Date().getDay();
  const todayAvail = availability?.find(a => a.day_of_week === todayDow);
  const availableMinutes = (() => {
    if (!todayAvail?.is_open) return 0;
    const [oh, om] = (todayAvail.open_time ?? "09:00").split(":").map(Number);
    const [ch, cm] = (todayAvail.close_time ?? "18:00").split(":").map(Number);
    return (ch * 60 + cm) - (oh * 60 + om);
  })();
  const bookedMinutes = (todayBookings ?? []).reduce((sum, b) => {
    const svc = services?.find(s => s.name === b.service);
    return sum + (b.duration_minutes ?? svc?.duration_minutes ?? 60);
  }, 0);
  const efficiency = availableMinutes > 0 ? Math.min(Math.round((bookedMinutes / availableMinutes) * 100), 100) : 0;

  // --- Redditività per servizio (30 giorni) ---
  const svcRevenue: Record<string, { count: number; revenue: number }> = {};
  for (const b of recentBookings ?? []) {
    const svc = services?.find(s => s.name === b.service);
    if (!svcRevenue[b.service]) svcRevenue[b.service] = { count: 0, revenue: 0 };
    svcRevenue[b.service].count++;
    svcRevenue[b.service].revenue += svc?.price ?? 0;
  }
  const sortedSvcs = Object.entries(svcRevenue).sort((a, b) => b[1].revenue - a[1].revenue);
  const maxRevenue = sortedSvcs[0]?.[1].revenue ?? 1;
  const totalRevenue = sortedSvcs.reduce((s, [, v]) => s + v.revenue, 0);

  // --- Stagionalità (12 mesi) ---
  const monthCounts: Record<string, number> = {};
  for (const b of allBookings ?? []) {
    const m = b.date.slice(0, 7);
    monthCounts[m] = (monthCounts[m] ?? 0) + 1;
  }
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), 11 - i);
    const key = format(d, "yyyy-MM");
    return { key, label: format(d, "MMM", { locale: it }), count: monthCounts[key] ?? 0 };
  });
  const maxCount = Math.max(...months.map(m => m.count), 1);

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Analisi</h1>

      {/* Efficienza */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-medium text-gray-900 text-sm mb-5">Efficienza oggi</h2>
        <div className="flex items-end gap-8 flex-wrap">
          <div>
            <p className="text-5xl font-bold text-gray-900">{efficiency}%</p>
            <p className="text-sm text-gray-400 mt-1">Agenda occupata</p>
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  efficiency >= 80 ? "bg-emerald-500" : efficiency >= 50 ? "bg-violet-500" : "bg-amber-400"
                }`}
                style={{ width: `${efficiency}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
              <span>{bookedMinutes} min prenotati</span>
              <span>{availableMinutes} min disponibili</span>
              <span>{(todayBookings ?? []).length} appuntamenti</span>
            </div>
          </div>
        </div>
      </div>

      {/* Redditività */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="font-medium text-gray-900 text-sm">Redditività per servizio</h2>
          <span className="text-xs text-gray-400">Ultimi 30 giorni · Totale €{totalRevenue.toFixed(0)}</span>
        </div>
        {!sortedSvcs.length ? (
          <p className="text-sm text-gray-400">Nessun dato.</p>
        ) : (
          <div className="space-y-4">
            {sortedSvcs.map(([name, { count, revenue }]) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-700">{name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{count} pren.</span>
                    <span className="text-sm font-semibold text-gray-900">€{revenue.toFixed(0)}</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 rounded-full"
                    style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stagionalità */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-medium text-gray-900 text-sm mb-5">Stagionalità — ultimi 12 mesi</h2>
        <div className="flex items-end gap-1 h-28">
          {months.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-0.5">
              {m.count > 0 && (
                <span className="text-[10px] text-gray-400 leading-none">{m.count}</span>
              )}
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${Math.max((m.count / maxCount) * 80, 3)}px`,
                  backgroundColor: m.key === format(new Date(), "yyyy-MM") ? "#7c3aed" : "#c4b5fd",
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-2">
          {months.map(m => (
            <div key={m.key} className="flex-1 min-w-0 text-center">
              <span className="text-[9px] text-gray-400 capitalize block truncate">{m.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-right">
          Totale: {(allBookings ?? []).length} appuntamenti
        </p>
      </div>
    </div>
  );
}
