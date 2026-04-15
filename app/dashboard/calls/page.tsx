import { getSupabaseAdmin } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const db = getSupabaseAdmin();
  const { data: calls } = await db
    .from("calls")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Chiamate</h1>

      <div className="bg-white rounded-xl border border-gray-200">
        {!calls?.length ? (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">Nessuna chiamata registrata.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {calls.map((c) => (
              <li key={c.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
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
                    {c.summary && (
                      <p className="text-xs text-gray-500 mt-1">{c.summary}</p>
                    )}
                    {c.transcript && (
                      <details className="mt-2">
                        <summary className="text-xs text-violet-600 cursor-pointer hover:text-violet-800">
                          Vedi trascrizione
                        </summary>
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
