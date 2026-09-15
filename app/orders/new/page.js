import { supabase } from "@/lib/supabase";
import { getSettings } from "@/lib/queries";
import { todayISO } from "@/lib/data";
import NewOrderForm from "./NewOrderForm";

export default async function NewOrderPage() {
  const { data: customers } = await supabase.from("customers").select("*").order("name");
  const settings = await getSettings();

  return (
    <NewOrderForm customers={customers || []} defaultPrice={settings.default_price_per_sqm} today={todayISO()} />
  );
}
