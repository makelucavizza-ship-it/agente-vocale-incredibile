import { getSupabaseAdmin } from "@/lib/supabase";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = getSupabaseAdmin();
  const today = format(new Date(), "yyyy-MM-dd");

  const [{ data: bookings }, { data: calls }] = await Promise.all([
    db.from("bookings").select("*, clients(name, phone)").eq("date", today).eq("status", "confirmed").order("time_slot"),
    db.from("calls").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: it });

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Buongiorno</h1>
        <p className="text-gray-400 text-sm mt-1 capitalize">{todayLabel}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Appuntamenti oggi</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{bookings?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Chiamate recenti</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{calls?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Prenotate via telefono</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {bookings?.filter((b) => b.source === "phone").length ?? 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Appuntamenti di oggi</h2>
        </div>
        {!bookings?.length ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Nessun appuntamento per oggi.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <li key={b.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{(b.clients as { name: string } | null)?.name ?? "—"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.service}</p>
                </div>
                <span className="text-sm text-gray-500 font-mono">{b.time_slot?.slice(0, 5)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!!calls?.length && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900 text-sm">Ultime chiamate</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {calls.map((c) => (
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
