"use client";

import { useState } from "react";
import { format, parseISO, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  clients: { name: string; phone?: string | null; allergies?: string | null } | null;
  colorClass: string;
}

interface Props {
  bookings: Booking[];
  weekStartStr: string;
  today: string;
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confermata", color: "text-emerald-700" },
  { value: "no_show",   label: "No-show",    color: "text-red-600" },
  { value: "cancelled", label: "Cancellata", color: "text-gray-500" },
];

function MobileBookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(booking.status);
  const [saving, setSaving] = useState(false);

  const clientName = booking.clients?.name ?? "—";
  const clientPhone = booking.clients?.phone;
  const allergies = booking.clients?.allergies;

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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
      >
        <div className={`h-1 w-full ${booking.colorClass.split(" ")[0]}`} />
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm truncate">{clientName}</p>
              {allergies && <span className="text-amber-500 shrink-0 text-xs">⚠</span>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{booking.service}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-gray-900">{booking.time_slot.slice(0, 5)}</p>
            <p className="text-[11px] text-gray-400">{booking.duration_minutes} min</p>
          </div>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-xl">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="px-5 pt-3 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 text-base">{clientName}</p>
                  {clientPhone && (
                    <a href={`tel:${clientPhone}`} className="text-sm text-violet-600 mt-0.5 block">{clientPhone}</a>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 p-1 -mr-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className={`rounded-xl px-4 py-3 border ${booking.colorClass}`}>
                <p className="font-semibold text-sm">{booking.service}</p>
                <p className="text-xs opacity-75 mt-0.5">
                  {booking.date} · {booking.time_slot.slice(0, 5)} · {booking.duration_minutes} min
                </p>
                {booking.source === "phone" && (
                  <span className="inline-block mt-1.5 text-[10px] bg-white/60 px-2 py-0.5 rounded-full">📞 prenotato da agente</span>
                )}
              </div>
              {allergies && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
                  <div>
                    <p className="text-xs font-semibold text-red-700">Allergie</p>
                    <p className="text-xs text-red-600 mt-0.5">{allergies}</p>
                  </div>
                </div>
              )}
              {booking.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-800">{booking.notes}</p>
                </div>
              )}
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

export default function CalendarMobileView({ bookings, weekStartStr, today }: Props) {
  const weekStart = parseISO(weekStartStr);
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  const todayInWeek = days.some(d => format(d, "yyyy-MM-dd") === today);
  const [selectedDate, setSelectedDate] = useState(todayInWeek ? today : format(days[0], "yyyy-MM-dd"));

  const dayBookings = bookings
    .filter(b => b.date === selectedDate)
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

  return (
    <div className="md:hidden">
      {/* Day selector strip */}
      <div className="flex gap-1.5 mb-5">
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const count = bookings.filter(b => b.date === dateStr).length;
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex-1 flex flex-col items-center py-2 rounded-2xl transition-all ${
                isSelected
                  ? "bg-violet-600 text-white shadow-sm"
                  : isToday
                    ? "bg-violet-50 text-violet-700 border border-violet-100"
                    : "bg-white text-gray-500 border border-gray-100"
              }`}
            >
              <span className="text-[9px] font-semibold uppercase tracking-wide">
                {format(day, "EEE", { locale: it })}
              </span>
              <span className="text-base font-bold leading-tight mt-0.5">{format(day, "d")}</span>
              {count > 0 ? (
                <span className={`text-[10px] font-bold mt-0.5 ${isSelected ? "text-violet-200" : "text-violet-500"}`}>
                  {count}
                </span>
              ) : (
                <span className="text-[10px] mt-0.5 opacity-0">0</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Booking list */}
      {dayBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-400">Nessun appuntamento</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayBookings.map(b => (
            <MobileBookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}
