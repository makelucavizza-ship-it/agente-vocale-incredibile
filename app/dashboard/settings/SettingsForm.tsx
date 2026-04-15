"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

interface Avail { day_of_week: number; open_time: string; close_time: string; is_open: boolean; }
interface Service { id: string; name: string; duration_minutes: number; price: number; active: boolean; }

export default function SettingsForm({ availability, services }: { availability: Avail[]; services: Service[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [avail, setAvail] = useState(availability);
  const [svcs, setSvcs] = useState(services);

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

  return (
    <div className="space-y-8">
      {/* Orari */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Orari di apertura</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {avail.map((a, i) => (
            <li key={a.day_of_week} className="px-6 py-3 flex items-center gap-4">
              <span className="text-sm text-gray-700 w-24 shrink-0">{DAYS[a.day_of_week]}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={a.is_open}
                  onChange={e => {
                    const updated = [...avail];
                    updated[i] = { ...a, is_open: e.target.checked };
                    setAvail(updated);
                  }}
                  className="accent-violet-600"
                />
                <span className="text-xs text-gray-500">Aperto</span>
              </label>
              <input
                type="time"
                value={a.open_time?.slice(0, 5) ?? "09:00"}
                disabled={!a.is_open}
                onChange={e => { const u = [...avail]; u[i] = { ...a, open_time: e.target.value }; setAvail(u); }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <span className="text-xs text-gray-400">–</span>
              <input
                type="time"
                value={a.close_time?.slice(0, 5) ?? "18:00"}
                disabled={!a.is_open}
                onChange={e => { const u = [...avail]; u[i] = { ...a, close_time: e.target.value }; setAvail(u); }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <button
                onClick={() => saveAvail(avail[i])}
                disabled={saving === `avail-${a.day_of_week}`}
                className="ml-auto text-xs px-3 py-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {saving === `avail-${a.day_of_week}` ? "..." : "Salva"}
              </button>
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
            <li key={s.id} className="px-6 py-3 flex items-center gap-3 flex-wrap">
              <input
                value={s.name}
                onChange={e => { const u = [...svcs]; u[i] = { ...s, name: e.target.value }; setSvcs(u); }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <input
                type="number"
                value={s.duration_minutes}
                onChange={e => { const u = [...svcs]; u[i] = { ...s, duration_minutes: +e.target.value }; setSvcs(u); }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <span className="text-xs text-gray-400">min</span>
              <span className="text-xs text-gray-400">€</span>
              <input
                type="number"
                value={s.price}
                onChange={e => { const u = [...svcs]; u[i] = { ...s, price: +e.target.value }; setSvcs(u); }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={s.active}
                  onChange={e => { const u = [...svcs]; u[i] = { ...s, active: e.target.checked }; setSvcs(u); }}
                  className="accent-violet-600"
                />
                <span className="text-xs text-gray-500">Attivo</span>
              </label>
              <button
                onClick={() => saveSvc(svcs[i])}
                disabled={saving === `svc-${s.id}`}
                className="ml-auto text-xs px-3 py-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {saving === `svc-${s.id}` ? "..." : "Salva"}
              </button>
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
