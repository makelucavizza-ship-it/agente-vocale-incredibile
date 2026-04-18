"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function ClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: client.name ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    birthday: client.birthday ?? "",
    skin_type: client.skin_type ?? "",
    allergies: client.allergies ?? "",
    notes: client.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-medium text-gray-900 text-sm mb-4">Dati clinici</h2>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Nome</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Telefono</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input
              type="email"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Data di nascita</label>
            <input
              type="date"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              value={form.birthday}
              onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Tipo di pelle</label>
            <select
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              value={form.skin_type}
              onChange={e => setForm(f => ({ ...f, skin_type: e.target.value }))}
            >
              <option value="">—</option>
              <option value="normale">Normale</option>
              <option value="secca">Secca</option>
              <option value="grassa">Grassa</option>
              <option value="mista">Mista</option>
              <option value="sensibile">Sensibile</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Allergie</label>
            <input
              placeholder="Es. nichel, profumi..."
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              value={form.allergies}
              onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500">Note</label>
          <textarea
            rows={3}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
        {/* Sticky save on mobile, inline on desktop */}
        <div className="fixed bottom-20 left-0 right-0 px-4 md:static md:px-0 md:flex md:justify-end z-20 pointer-events-none">
          <button
            type="submit"
            disabled={saving}
            className="pointer-events-auto w-full md:w-auto px-6 py-3 md:py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl md:rounded-lg shadow-lg md:shadow-none hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {saved ? "Salvato ✓" : saving ? "Salvo..." : "Salva scheda"}
          </button>
        </div>
      </form>
    </div>
  );
}
