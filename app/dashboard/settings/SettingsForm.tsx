"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

interface Avail { day_of_week: number; open_time: string; close_time: string; is_open: boolean; }
interface Service { id: string; name: string; duration_minutes: number; price: number; active: boolean; }

const FEATURE_FLAGS: { key: string; label: string; implemented: boolean }[] = [
  { key: "crm_enabled",        label: "CRM scheda cliente",              implemented: true },
  { key: "badge_noshow",       label: "Badge no-show su scheda",         implemented: true },
  { key: "efficiency_view",    label: "Vista efficienza giornata",       implemented: true },
  { key: "profitability_view", label: "Redditività per servizio",        implemented: true },
  { key: "seasonality_view",   label: "Stagionalità servizi",            implemented: true },
  { key: "smart_waitlist",     label: "Lista d'attesa intelligente",     implemented: true },
  { key: "reminder_24h",       label: "Reminder 24h WhatsApp",          implemented: false },
  { key: "briefing_wa",        label: "Briefing mattutino WhatsApp",     implemented: false },
  { key: "voice_notes",        label: "Note vocali post-trattamento",   implemented: false },
  { key: "post_treatment_wa",  label: "WhatsApp post-trattamento",      implemented: false },
  { key: "birthday_msg",       label: "Messaggio compleanno",           implemented: false },
  { key: "anniversary_msg",    label: "Anniversario prima visita",      implemented: false },
  { key: "monthly_report",     label: "Report mensile (Claude)",        implemented: false },
  { key: "revenue_forecast",   label: "Previsione fatturato 30gg",      implemented: false },
  { key: "google_reviews_auto",label: "Google Reviews automatiche",     implemented: false },
  { key: "referral_amplified", label: "Passaparola amplificato",        implemented: false },
];

export default function SettingsForm({
  availability,
  services,
  businessSettings = {},
}: {
  availability: Avail[];
  services: Service[];
  businessSettings?: Record<string, boolean>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [avail, setAvail] = useState(availability);
  const [svcs, setSvcs] = useState(services);
  const [flags, setFlags] = useState<Record<string, boolean>>(businessSettings);
  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  async function saveAvail(row: Avail) {
    setSaving(`avail-${row.day_of_week}`);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "availability", data: row }) });
    setSaving(null);
    router.refresh();
  }

  async function toggleFlag(key: string, value: boolean) {
    setSavingFlag(key);
    const updated = { ...flags, [key]: value };
    setFlags(updated);
    await fetch("/api/business-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSavingFlag(null);
  }

  async function saveSvc(svc: Service) {
    setSaving(`svc-${svc.id}`);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "service", data: svc }) });
    setSaving(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Orari */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Orari di apertura</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {avail.map((a, i) => (
            <li key={a.day_of_week} className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-20 shrink-0">{DAYS[a.day_of_week]}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={a.is_open}
                    onChange={e => {
                      const updated = [...avail];
                      updated[i] = { ...a, is_open: e.target.checked };
                      setAvail(updated);
                    }}
                    className="accent-violet-600 w-4 h-4"
                  />
                  <span className="text-xs text-gray-500">Aperto</span>
                </label>
                <button
                  onClick={() => saveAvail(avail[i])}
                  disabled={saving === `avail-${a.day_of_week}`}
                  className="ml-auto text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving === `avail-${a.day_of_week}` ? "..." : "Salva"}
                </button>
              </div>
              <div className={`flex items-center gap-2 ${!a.is_open ? "opacity-40" : ""}`}>
                <input
                  type="time"
                  value={a.open_time?.slice(0, 5) ?? "09:00"}
                  disabled={!a.is_open}
                  onChange={e => { const u = [...avail]; u[i] = { ...a, open_time: e.target.value }; setAvail(u); }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <span className="text-xs text-gray-400 shrink-0">–</span>
                <input
                  type="time"
                  value={a.close_time?.slice(0, 5) ?? "18:00"}
                  disabled={!a.is_open}
                  onChange={e => { const u = [...avail]; u[i] = { ...a, close_time: e.target.value }; setAvail(u); }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Servizi */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Servizi</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {svcs.map((s, i) => (
            <li key={s.id} className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={s.name}
                  placeholder="Nome servizio"
                  onChange={e => { const u = [...svcs]; u[i] = { ...s, name: e.target.value }; setSvcs(u); }}
                  className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={s.active}
                    onChange={e => { const u = [...svcs]; u[i] = { ...s, active: e.target.checked }; setSvcs(u); }}
                    className="accent-violet-600 w-4 h-4"
                  />
                  <span className="text-xs text-gray-500">Attivo</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={s.duration_minutes}
                  onChange={e => { const u = [...svcs]; u[i] = { ...s, duration_minutes: +e.target.value }; setSvcs(u); }}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <span className="text-xs text-gray-400">min</span>
                <span className="text-xs text-gray-400 pl-1">€</span>
                <input
                  type="number"
                  value={s.price}
                  onChange={e => { const u = [...svcs]; u[i] = { ...s, price: +e.target.value }; setSvcs(u); }}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <button
                  onClick={() => saveSvc(svcs[i])}
                  disabled={saving === `svc-${s.id}`}
                  className="ml-auto text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving === `svc-${s.id}` ? "..." : "Salva"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Feature flags */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Funzionalità</h2>
          <p className="text-xs text-gray-400 mt-0.5">Le funzionalità grigie richiedono integrazioni esterne</p>
        </div>
        <ul className="divide-y divide-gray-100">
          {FEATURE_FLAGS.map(f => (
            <li key={f.key} className="px-6 py-3 flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm ${f.implemented ? "text-gray-700" : "text-gray-400"}`}>{f.label}</p>
                {!f.implemented && (
                  <span className="text-[10px] text-gray-400">Prossimamente</span>
                )}
              </div>
              <label className={`relative inline-flex items-center cursor-pointer ${!f.implemented ? "opacity-40 pointer-events-none" : ""}`}>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!!flags[f.key]}
                  disabled={!f.implemented || savingFlag === f.key}
                  onChange={e => toggleFlag(f.key, e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
              </label>
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
          {[
            ["Nome", "Giulia"],
            ["Piattaforma", "VAPI"],
            ["Modello LLM", "Claude Haiku"],
            ["Voce", "ElevenLabs"],
            ["STT", "Deepgram nova-3 (it)"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
