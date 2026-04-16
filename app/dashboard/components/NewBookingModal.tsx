"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Service { id: string; name: string; duration_minutes: number; price: number; }

export default function NewBookingModal({ services }: { services: Service[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_phone: "", service: "", date: "", time_slot: "" });
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setForm({ client_name: "", client_phone: "", service: "", date: "", time_slot: "" });
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
      >
        + Nuova prenotazione
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Nuova prenotazione</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Nome cliente *</label>
                <input
                  required
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  value={form.client_name}
                  onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Telefono</label>
                <input
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  value={form.client_phone}
                  onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Servizio *</label>
                <select
                  required
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
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
                  <label className="text-xs text-gray-500 font-medium">Data *</label>
                  <input
                    required
                    type="date"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Orario *</label>
                  <input
                    required
                    type="time"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    value={form.time_slot}
                    onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? "Salvo..." : "Conferma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
