"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import ClientForm from "./ClientForm";

interface Client {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  skin_type?: string | null;
  allergies?: string | null;
  birthday?: string | null;
}

interface Booking {
  id: string;
  service: string;
  date: string;
  time_slot: string;
  status: string;
  source: string;
}

interface Service { id: string; name: string; duration_minutes: number; price: number; }

interface Props {
  client: Client;
  bookings: Booking[];
  noShows: number;
  visiteEffettuate: number;
  lastVisit: Booking | undefined;
  services: Service[];
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confermata",
  no_show: "No-show",
  cancelled: "Cancellata",
  pending: "In attesa",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  no_show: "bg-red-50 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
  pending: "bg-amber-50 text-amber-600",
};

const SKIN_LABELS: Record<string, string> = {
  normale: "Normale", secca: "Secca", grassa: "Grassa",
  mista: "Mista", sensibile: "Sensibile",
};

export default function ClientTabs({ client, bookings, noShows, visiteEffettuate, lastVisit, services }: Props) {
  const [tab, setTab] = useState<"profilo" | "storico">("profilo");

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-4 bg-white rounded-t-2xl overflow-hidden sticky top-0 z-10 shadow-sm">
        {(["profilo", "storico"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t
                ? "text-violet-600 border-b-2 border-violet-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "profilo" ? "Profilo" : `Storico (${bookings.length})`}
          </button>
        ))}
      </div>

      {tab === "profilo" && (
        <ClientForm client={client} />
      )}

      {tab === "storico" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {!bookings.length ? (
            <p className="px-6 py-12 text-sm text-gray-400 text-center">Nessuna prenotazione.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {[...bookings]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(b => (
                  <li key={b.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.service}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(parseISO(b.date), "d MMM yyyy", { locale: it })} · {b.time_slot?.slice(0, 5)}
                        {b.source === "phone" && (
                          <span className="ml-1.5 text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">📞 voce</span>
                        )}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
