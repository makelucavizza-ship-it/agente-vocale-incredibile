import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message } = body;

  if (!message) return NextResponse.json({ ok: true });

  // ── Tool calls ───────────────────────────────────────────────────────
  if (message.type === "tool-calls") {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const results = await Promise.all(
      message.toolCallList.map(async (call: { id: string; name: string; arguments: Record<string, string> }) => {
        let result = "";
        try {
          if (call.name === "check_availability") {
            const res = await fetch(`${base}/api/availability`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(call.arguments),
            });
            result = (await res.json()).result;
          } else if (call.name === "book_appointment") {
            const res = await fetch(`${base}/api/bookings`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(call.arguments),
            });
            result = (await res.json()).result;
          } else if (call.name === "get_client_info") {
            const res = await fetch(`${base}/api/clients?phone=${call.arguments.phone ?? ""}`);
            const data = await res.json();
            result = data ? `Cliente già registrata: ${data.name}.` : "Cliente non trovata in archivio.";
          } else if (call.name === "end_call") {
            result = "Arrivederci!";
          }
        } catch {
          result = "Errore tecnico, mi dispiace.";
        }
        return { toolCallId: call.id, result };
      })
    );

    return NextResponse.json({ results });
  }

  // ── Fine chiamata ────────────────────────────────────────────────────
  if (message.type === "end-of-call-report") {
    const db = getSupabaseAdmin();
    const { call, transcript, summary, recordingUrl } = message;

    const outcome = summary?.toLowerCase().includes("prenotat")
      ? "booked"
      : summary?.toLowerCase().includes("informazion")
      ? "info"
      : "dropped";

    await db.from("calls").insert({
      vapi_call_id: call?.id ?? null,
      client_phone: call?.customer?.number ?? null,
      duration_seconds:
        call?.endedAt && call?.startedAt
          ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
          : null,
      transcript: transcript ?? null,
      summary: summary ?? null,
      outcome,
      recording_url: recordingUrl ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}
