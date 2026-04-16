import { getSupabaseAdmin } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClientForm from "./ClientForm";

export const dynamic = "force-dynamic";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = getSupabaseAdmin();
  const { id } = await params;

  const { data: client } = await db
    .from("clients")
    .select("*, bookings(id, service, date, time_slot, status, source)")
    .eq("id", id)
    .single();

  if (!client) notFound();

  type Booking = { id: string; service: string; date: string; time_slot: string; status: string; source: string };
  const bookings: Booking[] = (client.bookings as Booking[]) ?? [];
  const noShows = bookings.filter(b => b.status === "no_show").length;
  const visiteEffettuate = bookings.filter(b => b.status !== "no_show" && b.status !== "cancelled").length;
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const lastVisit = bookings
    .filter(b => b.status !== "cancelled" && b.date <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const skinLabels: Record<string, string> = {
    normale: "Normale", secca: "Secca", grassa: "Grassa",
    mista: "Mista", sensibile: "Sensibile",
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/clients" className="text-sm text-gray-400 hover:text-gray-600">
          ← Clienti
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xl font-semibold">
                {client.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{client.phone ?? "—"}</p>
              {client.email && <p className="text-xs text-gray-400">{client.email}</p>}
              {client.birthday && (
                <p className="text-xs text-gray-400">
                  Nata il {format(parseISO(client.birthday), "d MMMM yyyy", { locale: it })}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {noShows > 0 && (
              <span className="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-full border border-red-100">
                {noShows} no-show{noShows > 1 ? "s" : ""}
              </span>
            )}
            {(client as { skin_type?: string }).skin_type && (
              <span className="text-xs bg-violet-50 text-violet-600 px-3 py-1.5 rounded-full border border-violet-100">
                Pelle {skinLabels[(client as { skin_type?: string }).skin_type!] ?? (client as { skin_type?: string }).skin_type}
              </span>
            )}
            {(client as { allergies?: string }).allergies && (
              <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100">
                ⚠ {(client as { allergies?: string }).allergies}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Prenotazioni</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{visiteEffettuate}</p>
            <p className="text-xs text-gray-400 mt-0.5">Visite</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-gray-900 leading-tight">
              {lastVisit ? format(parseISO(lastVisit.date), "d MMM", { locale: it }) : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Ultima visita</p>
          </div>
        </div>
      </div>

      {/* Clinical data form */}
      <ClientForm client={client as Parameters<typeof ClientForm>[0]["client"]} />

      {/* Booking history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-4">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Storico prenotazioni</h2>
        </div>
        {!bookings.length ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Nessuna prenotazione.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {[...bookings]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(b => (
                <li key={b.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{b.service}</p>
                    <p className="text-xs text-gray-400">
                      {format(parseISO(b.date), "d MMM yyyy", { locale: it })} · {b.time_slot?.slice(0, 5)}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                    b.status === "confirmed"
                      ? "bg-emerald-50 text-emerald-700"
                      : b.status === "no_show"
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {b.status === "confirmed" ? "Confermata"
                      : b.status === "no_show" ? "No-show"
                      : "Cancellata"}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
