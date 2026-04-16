import { getSupabaseAdmin } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";

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
                <li key={c.id}>
                  <Link href={`/dashboard/clients/${c.id}`} className="px-6 py-4 flex items-start justify-between hover:bg-gray-50/60 transition-colors block">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        {(c as { skin_type?: string }).skin_type && (
                          <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">
                            {(c as { skin_type?: string }).skin_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{c.phone ?? "—"}</p>
                      {(c as { allergies?: string }).allergies && (
                        <p className="text-xs text-amber-600 mt-0.5">⚠ {(c as { allergies?: string }).allergies}</p>
                      )}
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
                    <p className="text-xs text-gray-400 shrink-0 ml-2">{active.length} pren.</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
