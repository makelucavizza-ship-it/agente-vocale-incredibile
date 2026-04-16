"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

interface Entry {
  id: string;
  client_name: string;
  client_phone?: string;
  service: string;
  preferred_date?: string;
  notes?: string;
  created_at: string;
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_name: "", client_phone: "", service: "", preferred_date: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/waitlist");
    setEntries(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ client_name: "", client_phone: "", service: "", preferred_date: "", notes: "" });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/waitlist?id=${id}`, { method: "DELETE" });
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lista d&apos;attesa</h1>
          <p className="text-sm text-gray-400 mt-0.5">{entries.length} in attesa</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
        >
          + Aggiungi
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3">
          <h2 className="font-medium text-gray-900 text-sm">Nuova richiesta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Nome *</label>
              <input
                required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                value={form.client_name}
                onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Telefono</label>
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                value={form.client_phone}
                onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Servizio *</label>
              <input
                required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Data preferita</label>
              <input
                type="date"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                value={form.preferred_date}
                onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Note</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-3 py-2 text-sm text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "Salvo..." : "Aggiungi"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Caricamento...</p>
        ) : !entries.length ? (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">
            Lista d&apos;attesa vuota.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entries.map(e => (
              <li key={e.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{e.client_name}</p>
                    <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{e.service}</span>
                  </div>
                  {e.client_phone && (
                    <p className="text-xs text-gray-400 mt-0.5">{e.client_phone}</p>
                  )}
                  {e.preferred_date && (
                    <p className="text-xs text-gray-400">
                      Preferisce: {format(parseISO(e.preferred_date), "d MMM yyyy", { locale: it })}
                    </p>
                  )}
                  {e.notes && (
                    <p className="text-xs text-gray-500 italic mt-1">{e.notes}</p>
                  )}
                  <p className="text-xs text-gray-300 mt-1">
                    {format(parseISO(e.created_at), "d MMM", { locale: it })}
                  </p>
                </div>
                <button
                  onClick={() => remove(e.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                  title="Rimuovi"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
