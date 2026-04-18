"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  service: string;
  date: string;
  time_slot: string;
  duration_minutes: number;
  status: string;
  notes?: string | null;
  source: string;
  client_id: string;
  clients: { name: string; phone?: string | null } | null;
}

interface Props {
  booking: Booking;
  colorClass: string;
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confermata", color: "text-emerald-700" },
  { value: "no_show",   label: "No-show",    color: "text-red-600" },
  { value: "cancelled", label: "Cancellata", color: "text-gray-500" },
];

export default function BookingSlot({ booking, colorClass }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(booking.status);
  const [saving, setSaving] = useState(false);

  async function updateStatus(newStatus: string) {
    setSaving(true);
    setStatus(newStatus);
    await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    router.refresh();
  }

  const clientName = booking.clients?.name ?? "—";
  const clientPhone = booking.clients?.phone;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`w-full text-left text-xs rounded px-1.5 py-1 mb-1 border ${colorClass} hover:brightness-95 active:scale-[0.98] transition-all cursor-pointer`}
      >
        <p className="font-medium truncate">{clientName}</p>
        <p className="truncate opacity-70">{booking.service}</p>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-xl">
            {/* Handle mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 text-base">{clientName}</p>
                  {clientPhone && (
                    <a href={`tel:${clientPhone}`} className="text-sm text-violet-600 mt-0.5 block">
                      {clientPhone}
                    </a>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 -mr-1 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              {/* Service + time */}
              <div className={`rounded-xl px-4 py-3 border ${colorClass}`}>
                <p className="font-semibold text-sm">{booking.service}</p>
                <p className="text-xs opacity-75 mt-0.5">
                  {booking.date} · {booking.time_slot?.slice(0, 5)} · {booking.duration_minutes} min
                </p>
                {booking.source === "phone" && (
                  <span className="inline-block mt-1.5 text-[10px] bg-white/60 px-2 py-0.5 rounded-full">📞 prenotato da agente</span>
                )}
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-800">{booking.notes}</p>
                </div>
              )}

              {/* Status */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Stato appuntamento</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      disabled={saving}
                      onClick={() => updateStatus(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        status === opt.value
                          ? "border-gray-400 bg-gray-100 " + opt.color
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-2">
              <Link
                href={`/dashboard/clients/${booking.client_id}`}
                onClick={() => setOpen(false)}
                className="block w-full py-2.5 text-center text-sm font-semibold text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50 transition-colors"
              >
                Apri scheda cliente →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
