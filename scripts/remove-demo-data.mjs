// Removes ONLY the demo customers (and their orders/carpets/payments) that
// scripts/seed.mjs created — matched by their exact demo phone numbers, so
// this is safe to run even if you've already added real customers/orders.
//
// Run with:  npm run clean-demo

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const content = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    });
  } catch (e) {
    // ignore, rely on real env vars if present
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (check .env.local)");
  process.exit(1);
}

const supabase = createClient(url, key);

// Exact phone numbers used in scripts/seed.mjs — only these get removed.
const DEMO_PHONES = [
  "044 123 456",
  "049 234 567",
  "045 345 678",
  "044 456 789",
  "049 567 890",
  "045 678 901",
  "044 789 012",
  "049 890 123",
  "045 901 234",
  "044 012 345",
  "049 123 450",
  "045 234 561",
];

async function main() {
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, phone")
    .in("phone", DEMO_PHONES);

  if (error) throw error;

  if (!customers || customers.length === 0) {
    console.log("No demo customers found — nothing to remove.");
    return;
  }

  console.log(`Found ${customers.length} demo customers to remove:`);
  customers.forEach((c) => console.log(`  - ${c.name} (${c.phone})`));

  const ids = customers.map((c) => c.id);

  // orders delete cascades to carpets & payments automatically
  const { error: orderErr } = await supabase.from("orders").delete().in("customer_id", ids);
  if (orderErr) throw orderErr;

  const { error: custErr } = await supabase.from("customers").delete().in("id", ids);
  if (custErr) throw custErr;

  console.log(`Removed ${customers.length} demo customers and all their orders/payments.`);
  console.log("Reports and dashboard will now only reflect your real data.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
