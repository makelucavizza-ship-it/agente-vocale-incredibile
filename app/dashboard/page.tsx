import { getSupabaseAdmin } from "@/lib/supabase";
import { format, addDays } from "date-fns";
import { it } from "date-fns/locale";
import NewBookingModal from "./components/NewBookingModal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = getSupabaseAdmin();
  const today = new Date();
  const dates = [0, 1, 2].map(d => format(addDays(today, d), "yyyy-MM-dd"));

  const [{ data: bookings }, { data: calls }, { data: services }] = await Promise.all([
    db.from("bookings").select("*, clients(name, phone)")
      .in("date", dates).eq("status", "confirmed").order("date").order("time_slot"),
    db.from("calls").select("*").order("created_at", { ascending: false }).limit(5),
    db.from("services").select("*").eq("active", true).order("name"),
  ]);

  const todayLabel = format(today, "EEEE d MMMM yyyy", { locale: it });
  const todayStr = dates[0];
  const todayBookings = bookings?.filter(b => b.date === todayStr) ?? [];

  const dayLabels: Record<string, string> = {
    [dates[0]]: "Oggi",
    [dates[1]]: format(addDays(today, 1), "EEEE d MMM", { locale: it }),
    [dates[2]]: format(addDays(today, 2), "EEEE d MMM", { locale: it }),
  };

  const bookingsByDay = dates.map(d => ({
    date: d,
    label: dayLabels[d],
    items: bookings?.filter(b => b.date === d) ?? [],
  }));

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Buongiorno</h1>
          <p className="text-gray-400 text-sm mt-1 capitalize">{todayLabel}</p>
        </div>
        <NewBookingModal services={services ?? []} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Appuntamenti oggi</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{todayBookings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Chiamate recenti</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{calls?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Prenotate via telefono</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {todayBookings.filter(b => b.source === "phone").length}
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {bookingsByDay.map(({ date, label, items }) => (
          <div key={date} className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-medium text-gray-900 text-sm capitalize">{label}</h2>
              <span className="text-xs text-gray-400">{items.length} appuntament{items.length === 1 ? "o" : "i"}</span>
            </div>
            {!items.length ? (
              <p className="px-6 py-5 text-sm text-gray-400">Nessun appuntamento.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map(b => (
                  <li key={b.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{(b.clients as { name: string } | null)?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{b.service}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {b.source === "phone" && (
                        <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">telefono</span>
                      )}
                      <span className="text-sm text-gray-500 font-mono">{b.time_slot?.slice(0, 5)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {!!calls?.length && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900 text-sm">Ultime chiamate</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {calls.map(c => (
              <li key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{c.client_phone ?? "Numero sconosciuto"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.summary?.slice(0, 80) ?? "—"}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  c.outcome === "booked" ? "bg-green-50 text-green-700" :
                  c.outcome === "info" ? "bg-blue-50 text-blue-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {c.outcome === "booked" ? "Prenotata" : c.outcome === "info" ? "Info" : "Caduta"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
