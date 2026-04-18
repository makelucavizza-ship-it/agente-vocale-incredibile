"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Form {
  name: string;
  phone: string;
  email: string;
  birthday: string;
  skin_type: string;
  allergies: string;
  notes: string;
}

const EMPTY: Form = { name: "", phone: "", email: "", birthday: "", skin_type: "", allergies: "", notes: "" };

export default function NewClientButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof Form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Il nome è obbligatorio."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setError("Errore nel salvataggio."); return; }
    const client = await res.json();
    setOpen(false);
    setForm(EMPTY);
    router.push(`/dashboard/clients/${client.id}`);
  }

  const inputCls = "mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">Nuova scheda</span>
        <span className="sm:hidden">Nuova</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={e => { if (e.target === e.currentTarget) { setOpen(false); setForm(EMPTY); } }}
        >
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Nuova scheda cliente</h2>
              <button onClick={() => { setOpen(false); setForm(EMPTY); }} className="text-gray-400 hover:text-gray-600 p-1 -mr-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={save} className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Nome *</label>
                  <input
                    className={inputCls}
                    placeholder="Es. Giulia Rossi"
                    value={form.name}
                    onChange={set("name")}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Telefono</label>
                  <input type="tel" className={inputCls} placeholder="+39 333 1234567" value={form.phone} onChange={set("phone")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <input type="email" className={inputCls} placeholder="nome@email.it" value={form.email} onChange={set("email")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Data di nascita</label>
                  <input type="date" className={inputCls} value={form.birthday} onChange={set("birthday")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Tipo di pelle</label>
                  <select className={inputCls} value={form.skin_type} onChange={set("skin_type")}>
                    <option value="">—</option>
                    <option value="normale">Normale</option>
                    <option value="secca">Secca</option>
                    <option value="grassa">Grassa</option>
                    <option value="mista">Mista</option>
                    <option value="sensibile">Sensibile</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Allergie</label>
                  <input className={inputCls} placeholder="Es. nichel, profumi..." value={form.allergies} onChange={set("allergies")} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Note</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Note libere..." value={form.notes} onChange={set("notes")} />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>

            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={save}
                disabled={saving}
                className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm"
              >
                {saving ? "Creo scheda..." : "Crea scheda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
