import { getSupabaseAdmin } from "@/lib/supabase";
import { format, addDays, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import NewBookingModal from "./components/NewBookingModal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = getSupabaseAdmin();
  const today = new Date();
  const dates = [0, 1, 2].map(d => format(addDays(today, d), "yyyy-MM-dd"));

  const [{ data: bookings }, { data: calls }, { data: services }] = await Promise.all([
    db.from("bookings").select("*, clients(id, name, phone, skin_type, allergies)")
      .in("date", dates).eq("status", "confirmed").order("date").order("time_slot"),
    db.from("calls").select("*").order("created_at", { ascending: false }).limit(5),
    db.from("services").select("*").eq("active", true).order("name"),
  ]);

  const todayStr = dates[0];
  const todayBookings = bookings?.filter(b => b.date === todayStr) ?? [];
  const todayLabel = format(today, "EEEE d MMMM yyyy", { locale: it });

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

  const stats = [
    {
      label: "Appuntamenti oggi",
      value: todayBookings.length,
      bg: "bg-violet-600",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18"/></svg>,
    },
    {
      label: "Chiamate recenti",
      value: calls?.length ?? 0,
      bg: "bg-emerald-500",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
    },
    {
      label: "Prenotate da Giulia",
      value: todayBookings.filter(b => b.source === "phone").length,
      bg: "bg-sky-500",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
    },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Buongiorno</h1>
          <p className="text-gray-400 text-sm mt-1 capitalize">{todayLabel}</p>
        </div>
        <NewBookingModal services={services ?? []} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 text-white`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium opacity-80 uppercase tracking-wide">{s.label}</p>
              <div className="opacity-70">{s.icon}</div>
            </div>
            <p className="text-4xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Briefing prossimo appuntamento */}
      {(() => {
        const now = new Date();
        const nowStr = format(now, "HH:mm");
        const next = todayBookings.find(b => (b.time_slot ?? "00:00") >= nowStr);
        if (!next) return null;
        type C = { id: string; name: string; phone?: string; skin_type?: string; allergies?: string } | null;
        const c = next.clients as C;
        return (
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-5 mb-6">
            <p className="text-xs font-medium text-violet-500 uppercase tracking-wide mb-2">Prossimo appuntamento</p>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-gray-900">{c?.name ?? "—"}</p>
                <p className="text-sm text-gray-500 mt-0.5">{next.service} · <span className="font-mono">{next.time_slot?.slice(0,5)}</span></p>
                {c?.phone && <p className="text-xs text-gray-400 mt-0.5">{c.phone}</p>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {c?.skin_type && (
                    <span className="text-xs bg-white text-violet-600 px-2 py-0.5 rounded-full border border-violet-100">
                      Pelle {c.skin_type}
                    </span>
                  )}
                  {c?.allergies && (
                    <span className="text-xs bg-white text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">
                      ⚠ {c.allergies}
                    </span>
                  )}
                </div>
              </div>
              {c?.id && (
                <Link href={`/dashboard/clients/${c.id}`}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium">
                  Scheda →
                </Link>
              )}
            </div>
          </div>
        );
      })()}

      <div className="space-y-3 mb-6">
        {bookingsByDay.map(({ date, label, items }) => (
          <div key={date} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between bg-gray-50/60 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm capitalize">{label}</h2>
              <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                {items.length} appuntament{items.length === 1 ? "o" : "i"}
              </span>
            </div>
            {!items.length ? (
              <p className="px-6 py-5 text-sm text-gray-400">Nessun appuntamento.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {items.map(b => (
                  <li key={b.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-violet-600">
                          {((b.clients as { name: string } | null)?.name ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{(b.clients as { name: string } | null)?.name ?? "—"}</p>
                        <p className="text-xs text-gray-400">{b.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {b.source === "phone" && (
                        <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">Giulia</span>
                      )}
                      <span className="text-sm font-mono font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {b.time_slot?.slice(0, 5)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {!!calls?.length && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between bg-gray-50/60 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Ultime chiamate</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {calls.map(c => (
              <li key={c.id} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.client_phone ?? "Numero sconosciuto"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.summary?.slice(0, 80) ?? "—"}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  c.outcome === "booked" ? "bg-emerald-50 text-emerald-700" :
                  c.outcome === "info" ? "bg-sky-50 text-sky-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {c.outcome === "booked" ? "Prenotata" : c.outcome === "info" ? "Info" : "Caduta"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accesso rapido impostazioni */}
      <Link
        href="/dashboard/settings"
        className="mt-4 flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:bg-gray-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Impostazioni</p>
            <p className="text-xs text-gray-400">Orari, servizi, funzionalità</p>
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
