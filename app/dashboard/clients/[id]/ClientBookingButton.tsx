"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Service { id: string; name: string; duration_minutes: number; price: number; }

interface Props {
  clientId: string;
  clientName: string;
  clientPhone?: string | null;
  services: Service[];
}

const inputCls = "mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300";

export default function ClientBookingButton({ clientName, clientPhone, services }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ service: "", date: "", time_slot: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!form.service || !form.date || !form.time_slot) return;
    setSaving(true);
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: clientName,
        client_phone: clientPhone ?? "",
        service: form.service,
        date: form.date,
        time_slot: form.time_slot,
      }),
    });
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setForm({ service: "", date: "", time_slot: "" });
      router.refresh();
    }, 1000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Prenota
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-xl">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Nuova prenotazione</h2>
                <p className="text-sm text-gray-400 mt-0.5">{clientName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 p-1 -mr-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={book} className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Servizio *</label>
                <select
                  required
                  className={inputCls}
                  value={form.service}
                  onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                >
                  <option value="">Seleziona...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.duration_minutes} min)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Data *</label>
                  <input
                    required
                    type="date"
                    className={inputCls}
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Orario *</label>
                  <input
                    required
                    type="time"
                    className={inputCls}
                    value={form.time_slot}
                    onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))}
                  />
                </div>
              </div>
            </form>

            <div className="px-5 pb-6 pt-2">
              <button
                onClick={book}
                disabled={saving || done}
                className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm"
              >
                {done ? "Prenotato ✓" : saving ? "Salvo..." : "Conferma prenotazione"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
