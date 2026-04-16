"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

interface Avail { day_of_week: number; open_time: string; close_time: string; is_open: boolean; }
interface Service { id: string; name: string; duration_minutes: number; price: number; active: boolean; }
interface ConfigField { key: string; label: string; placeholder?: string; type?: string; rows?: number; }

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  implemented: boolean;
  configFields?: ConfigField[];
}

const FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: "crm_enabled",
    label: "CRM scheda cliente",
    description: "Scheda dettagliata per ogni cliente: tipo di pelle, allergie, compleanno, storico visite e note cliniche. Accessibile dalla sezione Clienti.",
    implemented: true,
  },
  {
    key: "badge_noshow",
    label: "Badge no-show",
    description: "Mostra un badge rosso sul profilo dei clienti che non si sono presentati senza avvisare. Visibile nella lista e nella scheda cliente.",
    implemented: true,
  },
  {
    key: "efficiency_view",
    label: "Vista efficienza giornata",
    description: "Percentuale di agenda occupata oggi rispetto alle ore disponibili, con numero di appuntamenti e minuti prenotati. Sezione Analisi.",
    implemented: true,
  },
  {
    key: "profitability_view",
    label: "Redditività per servizio",
    description: "Classifica i servizi per fatturato generato negli ultimi 30 giorni, con barre comparative. Sezione Analisi.",
    implemented: true,
  },
  {
    key: "seasonality_view",
    label: "Stagionalità servizi",
    description: "Andamento delle prenotazioni mese per mese negli ultimi 12 mesi, con grafico a barre. Sezione Analisi.",
    implemented: true,
  },
  {
    key: "smart_waitlist",
    label: "Lista d'attesa intelligente",
    description: "Gestisci i clienti in attesa di uno slot libero. Ogni richiesta include nome, servizio, telefono e data preferita. Sezione Lista attesa.",
    implemented: true,
  },
  {
    key: "reminder_24h",
    label: "Reminder 24h WhatsApp",
    description: "Messaggio WhatsApp automatico 24 ore prima di ogni appuntamento. Se la cliente risponde 'No', lo slot si libera in automatico.",
    implemented: false,
    configFields: [
      {
        key: "message_template",
        label: "Testo del messaggio",
        placeholder: "Ciao {nome}! Ti ricordiamo l'appuntamento di domani alle {ora} per {servizio} da Armonia. Confermi? Rispondi Sì o No 🌸",
        rows: 4,
      },
    ],
  },
  {
    key: "briefing_wa",
    label: "Briefing mattutino WhatsApp",
    description: "Riepilogo degli appuntamenti del giorno inviato via WhatsApp ogni mattina, prima che inizi il lavoro.",
    implemented: false,
    configFields: [
      { key: "phone", label: "Il tuo numero WhatsApp", placeholder: "+39 347 123 4567" },
      { key: "send_time", label: "Orario di invio", placeholder: "08:00", type: "time" },
    ],
  },
  {
    key: "post_treatment_wa",
    label: "WhatsApp post-trattamento",
    description: "Messaggio personalizzato inviato poche ore dopo la visita, con consigli specifici per il trattamento ricevuto.",
    implemented: false,
    configFields: [
      {
        key: "message_template",
        label: "Testo del messaggio",
        placeholder: "Ciao {nome}! Grazie per la tua visita di oggi ✨ Ecco qualche consiglio per {servizio}: ...",
        rows: 4,
      },
    ],
  },
  {
    key: "birthday_msg",
    label: "Messaggio di compleanno",
    description: "Auguri automatici inviati 3 giorni prima del compleanno della cliente, con possibilità di includere un'offerta speciale.",
    implemented: false,
    configFields: [
      {
        key: "message_template",
        label: "Testo del messaggio",
        placeholder: "Ciao {nome}! Tra poco è il tuo compleanno 🎂 Vieni a farti coccolare da noi — hai un regalo che ti aspetta!",
        rows: 3,
      },
    ],
  },
  {
    key: "anniversary_msg",
    label: "Anniversario prima visita",
    description: "Messaggio automatico per l'anniversario della prima visita. Rinforza il legame e può includere un'offerta fedeltà.",
    implemented: false,
    configFields: [
      {
        key: "message_template",
        label: "Testo del messaggio",
        placeholder: "Ciao {nome}! Oggi è l'anniversario della tua prima visita da Armonia 🌸 Grazie per la tua fedeltà!",
        rows: 3,
      },
    ],
  },
  {
    key: "monthly_report",
    label: "Report mensile (Claude)",
    description: "Report narrativo generato da Claude ogni mese: andamento prenotazioni, clienti più fedeli, servizi in crescita e suggerimenti operativi.",
    implemented: false,
  },
  {
    key: "revenue_forecast",
    label: "Previsione fatturato 30 giorni",
    description: "Stima del fatturato per i prossimi 30 giorni basata sullo storico prenotazioni e sulla stagionalità dei servizi.",
    implemented: false,
  },
  {
    key: "google_reviews_auto",
    label: "Google Reviews automatiche",
    description: "Richiesta di recensione Google inviata automaticamente 2 ore dopo la visita, solo alle clienti con storico positivo.",
    implemented: false,
    configFields: [
      { key: "review_link", label: "Link Google Reviews", placeholder: "https://g.page/r/..." },
    ],
  },
  {
    key: "referral_amplified",
    label: "Passaparola amplificato",
    description: "Messaggio post-trattamento che invita la cliente a condividere l'esperienza con un'amica, con link tracciabile.",
    implemented: false,
    configFields: [
      {
        key: "message_template",
        label: "Testo del messaggio",
        placeholder: "Ciao {nome}! Se sei soddisfatta, porta un'amica da noi — per te e per lei un trattamento in omaggio 🎁",
        rows: 3,
      },
      { key: "referral_link", label: "Link referral (opzionale)", placeholder: "https://..." },
    ],
  },
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
  const [configModal, setConfigModal] = useState<string | null>(null);
  const [featureConfigs, setFeatureConfigs] = useState<Record<string, Record<string, string>>>({});
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    fetch("/api/feature-config")
      .then(r => r.json())
      .then(data => setFeatureConfigs(data))
      .catch(() => {});
  }, []);

  async function saveAvail(row: Avail) {
    setSaving(`avail-${row.day_of_week}`);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "availability", data: row }) });
    setSaving(null);
    router.refresh();
  }

  async function saveSvc(svc: Service) {
    setSaving(`svc-${svc.id}`);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "service", data: svc }) });
    setSaving(null);
    router.refresh();
  }

  async function toggleFlag(key: string, value: boolean) {
    setSavingFlag(key);
    setFlags(f => ({ ...f, [key]: value }));
    await fetch("/api/business-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSavingFlag(null);
  }

  async function saveConfig(key: string) {
    setConfigSaving(true);
    await fetch("/api/feature-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, config: featureConfigs[key] ?? {} }),
    });
    setConfigSaving(false);
    setConfigSaved(true);
    setTimeout(() => { setConfigSaved(false); setConfigModal(null); }, 1000);
  }

  const activeModal = FEATURE_FLAGS.find(f => f.key === configModal);

  return (
    <div className="space-y-8">

      {/* Config modal */}
      {configModal && activeModal?.configFields && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">{activeModal.label}</h2>
            <p className="text-xs text-gray-400 mb-5">{activeModal.description}</p>
            <div className="space-y-4">
              {activeModal.configFields.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-gray-600">{field.label}</label>
                  {field.rows ? (
                    <textarea
                      rows={field.rows}
                      placeholder={field.placeholder}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                      value={featureConfigs[configModal]?.[field.key] ?? ""}
                      onChange={e => setFeatureConfigs(prev => ({
                        ...prev,
                        [configModal]: { ...(prev[configModal] ?? {}), [field.key]: e.target.value },
                      }))}
                    />
                  ) : (
                    <input
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                      value={featureConfigs[configModal]?.[field.key] ?? ""}
                      onChange={e => setFeatureConfigs(prev => ({
                        ...prev,
                        [configModal]: { ...(prev[configModal] ?? {}), [field.key]: e.target.value },
                      }))}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfigModal(null)}
                className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => saveConfig(configModal)}
                disabled={configSaving}
                className="flex-1 px-4 py-2.5 text-sm text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {configSaved ? "Salvato ✓" : configSaving ? "Salvo..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <p className="text-xs text-gray-400 mt-0.5">Le funzionalità grigie richiedono integrazioni esterne non ancora attive</p>
        </div>
        <ul className="divide-y divide-gray-100">
          {FEATURE_FLAGS.map(f => (
            <li key={f.key} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${f.implemented ? "text-gray-900" : "text-gray-400"}`}>
                    {f.label}
                    {!f.implemented && (
                      <span className="ml-2 text-[10px] font-normal bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full align-middle">
                        Prossimamente
                      </span>
                    )}
                  </p>
                  <p className={`text-xs mt-1 leading-relaxed ${f.implemented ? "text-gray-500" : "text-gray-400"}`}>
                    {f.description}
                  </p>
                  {f.configFields && (
                    <button
                      onClick={() => setConfigModal(f.key)}
                      className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        f.implemented
                          ? "border-violet-200 text-violet-600 hover:bg-violet-50"
                          : "border-gray-200 text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      Configura →
                    </button>
                  )}
                </div>
                <label className={`relative inline-flex items-center cursor-pointer shrink-0 mt-0.5 ${!f.implemented ? "opacity-40 pointer-events-none" : ""}`}>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!flags[f.key]}
                    disabled={!f.implemented || savingFlag === f.key}
                    onChange={e => toggleFlag(f.key, e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
                </label>
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
