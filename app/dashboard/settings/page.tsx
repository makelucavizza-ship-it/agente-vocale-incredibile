import { getSupabaseAdmin } from "@/lib/supabase";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const db = getSupabaseAdmin();
  const [{ data: availability }, { data: services }, { data: bsRows }, { data: closures }] = await Promise.all([
    db.from("availability").select("*").order("day_of_week"),
    db.from("services").select("*").order("name"),
    db.from("business_settings").select("key, value"),
    db.from("closures").select("*").order("date"),
  ]);

  const businessSettings = Object.fromEntries((bsRows ?? []).map(r => [r.key, r.value]));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Impostazioni</h1>
      <SettingsForm
        availability={availability ?? []}
        services={services ?? []}
        businessSettings={businessSettings}
        closures={closures ?? []}
      />
    </div>
  );
}
