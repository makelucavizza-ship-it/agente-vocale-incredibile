import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ── Verifica firma VAPI ──────────────────────────────────────────────
  const signature = req.headers.get("x-vapi-signature");
  const rawBody = await req.text();
  const secret = process.env.VAPI_WEBHOOK_SECRET;

  if (secret) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = JSON.parse(rawBody);
  const { message } = body;

  if (!message) return NextResponse.json({ ok: true });

  // ── Tool calls ───────────────────────────────────────────────────────
  if (message.type === "tool-calls") {
    const base = process.env.NEXT_PUBLIC_SITE_URL;
    if (!base) {
      console.error("[vapi/webhook] NEXT_PUBLIC_SITE_URL non configurato");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

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
            // POST body invece di query string per non loggare il numero nei server log
            const res = await fetch(`${base}/api/clients/lookup`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: call.arguments.phone ?? "" }),
            });
            const data = await res.json();
            result = data?.name
              ? `Cliente già registrata: ${data.name}.`
              : "Cliente non trovata in archivio.";
          } else if (call.name === "end_call") {
            result = "Arrivederci!";
          }
        } catch (err) {
          console.error("[vapi/webhook] tool call error:", err);
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

    const { error } = await db.from("calls").insert({
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

    if (error) console.error("[vapi/webhook] insert calls error:", error.message);
  }

  return NextResponse.json({ ok: true });
}
