import { getSupabaseAdmin } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const db = getSupabaseAdmin();
  const { search } = await searchParams;

  let query = db.from("clients").select("*, bookings(service, date, time_slot, status)").order("created_at", { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

  const { data: clients } = await query;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Clienti</h1>
        <p className="text-sm text-gray-400">{clients?.length ?? 0} totali</p>
      </div>

      <form method="GET" className="mb-4">
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="Cerca per nome o telefono..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        />
      </form>

      <div className="bg-white rounded-xl border border-gray-200">
        {!clients?.length ? (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">
            {search ? "Nessun risultato." : "Nessun cliente registrato."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {clients.map(c => {
              const bookings = (c.bookings as { service: string; date: string; time_slot: string; status: string }[]) ?? [];
              const active = bookings.filter(b => b.status === "confirmed");
              return (
                <li key={c.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.phone ?? "—"}</p>
                      {c.notes && <p className="text-xs text-gray-500 mt-1 italic">{c.notes}</p>}
                      {active.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {active.slice(0, 3).map((b, i) => (
                            <span key={i} className="text-xs bg-violet-50 text-violet-700 rounded px-2 py-0.5">
                              {b.service} — {format(parseISO(b.date), "d MMM", { locale: it })} {b.time_slot?.slice(0, 5)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{active.length} prenotazion{active.length === 1 ? "e" : "i"}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
