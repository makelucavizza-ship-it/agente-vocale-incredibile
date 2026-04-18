import { getSupabaseAdmin } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClientTabs from "./ClientTabs";
import ClientBookingButton from "./ClientBookingButton";

export const dynamic = "force-dynamic";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = getSupabaseAdmin();
  const { id } = await params;

  const [{ data: client }, { data: services }] = await Promise.all([
    db.from("clients").select("*, bookings(id, service, date, time_slot, status, source)").eq("id", id).single(),
    db.from("services").select("*").eq("active", true).order("name"),
  ]);

  if (!client) notFound();

  type Booking = { id: string; service: string; date: string; time_slot: string; status: string; source: string };
  const bookings: Booking[] = (client.bookings as Booking[]) ?? [];
  const noShows = bookings.filter(b => b.status === "no_show").length;
  const visiteEffettuate = bookings.filter(b => b.status !== "no_show" && b.status !== "cancelled").length;
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const lastVisit = bookings
    .filter(b => b.status !== "cancelled" && b.date <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const skinType = (client as { skin_type?: string }).skin_type;
  const allergies = (client as { allergies?: string }).allergies;
  const birthday = (client as { birthday?: string }).birthday;

  const skinLabels: Record<string, string> = {
    normale: "Normale", secca: "Secca", grassa: "Grassa",
    mista: "Mista", sensibile: "Sensibile",
  };

  const initials = client.name
    ?.split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Clienti
        </Link>
        <ClientBookingButton
          clientId={client.id}
          clientName={client.name}
          clientPhone={(client as { phone?: string }).phone}
          services={services ?? []}
        />
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {/* Gradient header strip */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 pt-6 pb-10 relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0 ring-2 ring-white/40">
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-tight">{client.name}</h1>
              {client.phone && (
                <a href={`tel:${client.phone}`} className="text-sm text-violet-200 mt-0.5 block">
                  {client.phone}
                </a>
              )}
              {client.email && <p className="text-xs text-violet-300 mt-0.5">{client.email}</p>}
              {birthday && (
                <p className="text-xs text-violet-300 mt-0.5">
                  Nata il {format(parseISO(birthday), "d MMMM yyyy", { locale: it })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Badges overlap */}
        <div className="-mt-5 px-5 flex flex-wrap gap-2 mb-4">
          {noShows > 0 && (
            <span className="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-full border border-red-100 shadow-sm">
              {noShows} no-show{noShows > 1 ? "s" : ""}
            </span>
          )}
          {skinType && (
            <span className="text-xs bg-white text-violet-600 px-3 py-1.5 rounded-full border border-violet-100 shadow-sm font-medium">
              Pelle {skinLabels[skinType] ?? skinType}
            </span>
          )}
          {allergies && (
            <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100 shadow-sm">
              ⚠ {allergies}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 px-5 pb-5">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">Prenotazioni</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{visiteEffettuate}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">Visite</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-gray-900 leading-snug">
              {lastVisit ? format(parseISO(lastVisit.date), "d MMM", { locale: it }) : "—"}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">Ultima visita</p>
          </div>
        </div>
      </div>

      {/* Tabs: Profilo + Storico */}
      <ClientTabs
        client={client as Parameters<typeof ClientTabs>[0]["client"]}
        bookings={bookings}
        noShows={noShows}
        visiteEffettuate={visiteEffettuate}
        lastVisit={lastVisit}
        services={services ?? []}
      />
    </div>
  );
}
