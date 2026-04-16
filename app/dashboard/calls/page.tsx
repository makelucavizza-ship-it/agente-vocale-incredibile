import { getSupabaseAdmin } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";

const OUTCOMES = [
  { value: "", label: "Tutte" },
  { value: "booked", label: "Prenotata" },
  { value: "info", label: "Info" },
  { value: "dropped", label: "Caduta" },
];

export default async function CallsPage({ searchParams }: { searchParams: Promise<{ outcome?: string; date?: string }> }) {
  const db = getSupabaseAdmin();
  const { outcome, date } = await searchParams;

  let query = db.from("calls").select("*").order("created_at", { ascending: false }).limit(50);
  if (outcome) query = query.eq("outcome", outcome);
  if (date) query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);

  const { data: calls } = await query;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Chiamate</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="date"
            defaultValue={date ?? ""}
            onChange={() => {}}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300 w-full sm:w-auto"
            // handled via links below
          />
          <div className="flex gap-1 flex-wrap">
            {OUTCOMES.map(o => (
              <Link
                key={o.value}
                href={`/dashboard/calls${o.value ? `?outcome=${o.value}` : ""}`}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  (outcome ?? "") === o.value
                    ? "bg-violet-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {o.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {!calls?.length ? (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">Nessuna chiamata trovata.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {calls.map(c => (
              <li key={c.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{c.client_phone ?? "Numero sconosciuto"}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.outcome === "booked" ? "bg-green-50 text-green-700" :
                        c.outcome === "info" ? "bg-blue-50 text-blue-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {c.outcome === "booked" ? "Prenotata" : c.outcome === "info" ? "Info" : "Caduta"}
                      </span>
                      {c.duration_seconds && (
                        <span className="text-xs text-gray-400">
                          {Math.floor(c.duration_seconds / 60)}:{String(c.duration_seconds % 60).padStart(2, "0")} min
                        </span>
                      )}
                    </div>
                    {c.summary && <p className="text-xs text-gray-500 mt-1">{c.summary}</p>}
                    {c.transcript && (
                      <details className="mt-2">
                        <summary className="text-xs text-violet-600 cursor-pointer hover:text-violet-800">Vedi trascrizione</summary>
                        <p className="mt-2 text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 rounded p-3 max-h-48 overflow-y-auto">
                          {c.transcript}
                        </p>
                      </details>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {c.created_at ? format(parseISO(c.created_at), "d MMM, HH:mm", { locale: it }) : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
