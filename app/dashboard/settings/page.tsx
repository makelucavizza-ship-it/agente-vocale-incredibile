import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

export default async function SettingsPage() {
  const db = getSupabaseAdmin();
  const [{ data: availability }, { data: services }] = await Promise.all([
    db.from("availability").select("*").order("day_of_week"),
    db.from("services").select("*").order("name"),
  ]);

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Impostazioni</h1>

      {/* Orari */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Orari di apertura</h2>
          <p className="text-xs text-gray-400 mt-0.5">Modifica direttamente da Supabase → tabella availability</p>
        </div>
        <ul className="divide-y divide-gray-100">
          {availability?.map((a) => (
            <li key={a.day_of_week} className="px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-700 w-28">{DAYS[a.day_of_week]}</span>
              {a.is_open ? (
                <span className="text-sm text-gray-900 font-mono">
                  {a.open_time?.slice(0, 5)} – {a.close_time?.slice(0, 5)}
                </span>
              ) : (
                <span className="text-sm text-gray-400">Chiuso</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_open ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                {a.is_open ? "Aperto" : "Chiuso"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Servizi */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Servizi</h2>
          <p className="text-xs text-gray-400 mt-0.5">Modifica direttamente da Supabase → tabella services</p>
        </div>
        <ul className="divide-y divide-gray-100">
          {services?.map((s) => (
            <li key={s.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.duration_minutes} min</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">€{s.price}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {s.active ? "Attivo" : "Inattivo"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Info agente */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Agente vocale</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Nome</span>
            <span className="text-gray-900">Giulia</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Piattaforma</span>
            <span className="text-gray-900">VAPI</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Modello LLM</span>
            <span className="text-gray-900">Claude Haiku</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Voce</span>
            <span className="text-gray-900">ElevenLabs</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">STT</span>
            <span className="text-gray-900">Deepgram nova-3 (it)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Assistant ID</span>
            <span className="text-gray-400 font-mono text-xs">bd87a533-7aac-4c3a-a059-a5166b099482</span>
          </div>
        </div>
      </div>
    </div>
  );
}
