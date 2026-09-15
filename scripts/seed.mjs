// Seed the Supabase database with realistic demo data.
// Run with:  npm run seed
// This WIPES existing customers/orders/carpets/payments and recreates demo data.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no extra dependency needed)
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

const CUSTOMERS = [
  ["Elira Krasniqi", "044 123 456", "Rr. Nëna Terezë 12, Prishtina"],
  ["Blerim Gashi", "049 234 567", "Rr. UÇK 45, Prishtina"],
  ["Fatmire Berisha", "045 345 678", "Rr. Agim Ramadani 8, Prishtina"],
  ["Ardit Hoxha", "044 456 789", "Rr. Luan Haradinaj 3, Peja"],
  ["Vesa Krasniqi", "049 567 890", "Rr. Skenderbeu 21, Gjakova"],
  ["Driton Morina", "045 678 901", "Rr. Ilir Konushevci 9, Prizren"],
  ["Arta Shala", "044 789 012", "Rr. Bill Clinton 60, Prishtina"],
  ["Besnik Rama", "049 890 123", "Rr. Dëshmorët e Kombit 5, Ferizaj"],
  ["Diellza Ahmeti", "045 901 234", "Rr. Zahir Pajaziti 17, Mitrovica"],
  ["Genc Sylaj", "044 012 345", "Rr. George Bush 2, Prishtina"],
  ["Lirie Zeqiri", "049 123 450", "Rr. Adem Jashari 33, Gjilan"],
  ["Petrit Kelmendi", "045 234 561", "Rr. Rexhep Luci 14, Prishtina"],
];

const STATUS_FLOW = ["New Order", "Collected", "At Factory", "Cleaning", "Ready", "Out for Delivery", "Delivered"];

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysAgoDate(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

let orderCounter = 0;

async function makeOrder({ customerId, daysAgo, status, price = 1.5, carpets, paidRatio, notes = "" }) {
  orderCounter += 1;
  const orderNumber = `ORD-${String(orderCounter).padStart(5, "0")}`;

  const statusIndex = STATUS_FLOW.indexOf(status);
  const patch = {
    order_number: orderNumber,
    customer_id: customerId,
    created_at: daysAgoISO(daysAgo),
    status,
    price_per_sqm: price,
    notes,
  };
  if (statusIndex >= 1) patch.collection_date = daysAgoDate(Math.max(daysAgo - 1, 0));
  if (statusIndex >= 2) patch.factory_received_date = daysAgoDate(Math.max(daysAgo - 2, 0));
  if (statusIndex >= 4) patch.cleaning_completed_date = daysAgoDate(Math.max(daysAgo - 4, 0));
  if (statusIndex >= 6) patch.delivery_date = daysAgoDate(Math.max(daysAgo - 6, 0));

  const { data: order, error } = await supabase.from("orders").insert(patch).select().single();
  if (error) throw error;

  const carpetRows = carpets.map(([length, width], i) => ({
    order_id: order.id,
    length,
    width,
    price_per_sqm: price,
    label: `Carpet ${i + 1}`,
  }));
  const { error: carpetErr } = await supabase.from("carpets").insert(carpetRows);
  if (carpetErr) throw carpetErr;

  const total = carpets.reduce((s, [l, w]) => s + l * w, 0) * price;
  if (paidRatio && total > 0) {
    const paidAmount = Math.round(total * paidRatio * 100) / 100;
    if (paidAmount > 0) {
      await supabase.from("payments").insert({
        order_id: order.id,
        amount: paidAmount,
        date: daysAgoDate(Math.max(daysAgo - 1, 0)),
        note: "Cash payment",
      });
    }
  }
  return order;
}

async function main() {
  console.log("Wiping existing data...");
  await supabase.from("payments").delete().neq("id", 0);
  await supabase.from("carpets").delete().neq("id", 0);
  await supabase.from("orders").delete().neq("id", 0);
  await supabase.from("customers").delete().neq("id", 0);

  const { data: existingSettings } = await supabase.from("settings").select("id").limit(1).maybeSingle();
  if (existingSettings) {
    await supabase
      .from("settings")
      .update({ business_name: "Kristal Carpet Cleaning", default_price_per_sqm: 1.5 })
      .eq("id", existingSettings.id);
  } else {
    await supabase.from("settings").insert({ business_name: "Kristal Carpet Cleaning", default_price_per_sqm: 1.5 });
  }

  console.log("Creating customers...");
  const customerIds = [];
  for (const [name, phone, address] of CUSTOMERS) {
    const { data, error } = await supabase.from("customers").insert({ name, phone, address }).select().single();
    if (error) throw error;
    customerIds.push(data.id);
  }

  console.log("Creating orders...");
  const c = customerIds;

  await makeOrder({ customerId: c[0], daysAgo: 25, status: "Delivered", carpets: [[3.0, 2.0], [2.5, 1.8]], paidRatio: 1.0 });
  await makeOrder({ customerId: c[1], daysAgo: 20, status: "Delivered", carpets: [[4.0, 3.0]], paidRatio: 1.0 });
  await makeOrder({ customerId: c[2], daysAgo: 18, status: "Delivered", carpets: [[2.0, 1.5], [3.5, 2.2], [1.8, 1.2]], paidRatio: 1.0 });
  await makeOrder({ customerId: c[3], daysAgo: 15, status: "Delivered", carpets: [[5.0, 3.5]], paidRatio: 0.6, notes: "Customer requested extra stain treatment" });
  await makeOrder({ customerId: c[4], daysAgo: 12, status: "Delivered", carpets: [[2.2, 1.6]], paidRatio: 1.0 });
  await makeOrder({ customerId: c[5], daysAgo: 10, status: "Delivered", carpets: [[3.0, 2.5], [2.0, 2.0]], paidRatio: 1.0 });
  await makeOrder({ customerId: c[6], daysAgo: 9, status: "Delivered", carpets: [[4.5, 3.0]], paidRatio: 1.0 });
  await makeOrder({ customerId: c[7], daysAgo: 8, status: "Delivered", carpets: [[2.5, 1.5]], paidRatio: 1.0, price: 1.7 });

  await makeOrder({ customerId: c[8], daysAgo: 6, status: "Out for Delivery", carpets: [[3.2, 2.1]], paidRatio: 0.5 });
  await makeOrder({ customerId: c[9], daysAgo: 5, status: "Out for Delivery", carpets: [[2.8, 2.0], [1.5, 1.0]], paidRatio: 1.0 });
  await makeOrder({ customerId: c[10], daysAgo: 5, status: "Out for Delivery", carpets: [[4.0, 2.5]], paidRatio: 0.0 });

  await makeOrder({ customerId: c[11], daysAgo: 4, status: "Ready", carpets: [[3.0, 3.0]], paidRatio: 1.0 });
  await makeOrder({ customerId: c[0], daysAgo: 4, status: "Ready", carpets: [[2.0, 1.8], [2.5, 1.5]], paidRatio: 0.4 });
  await makeOrder({ customerId: c[1], daysAgo: 3, status: "Ready", carpets: [[5.5, 3.8]], paidRatio: 0.0 });

  await makeOrder({ customerId: c[2], daysAgo: 3, status: "Cleaning", carpets: [[3.3, 2.2]], paidRatio: 0.5 });
  await makeOrder({ customerId: c[3], daysAgo: 2, status: "Cleaning", carpets: [[2.7, 1.9], [2.0, 1.5]], paidRatio: 0.0 });
  await makeOrder({ customerId: c[4], daysAgo: 2, status: "Cleaning", carpets: [[4.2, 3.1]], paidRatio: 1.0 });

  await makeOrder({ customerId: c[5], daysAgo: 2, status: "At Factory", carpets: [[3.0, 2.0]], paidRatio: 0.0 });
  await makeOrder({ customerId: c[6], daysAgo: 2, status: "At Factory", carpets: [[2.5, 2.0], [1.8, 1.2]], paidRatio: 0.3 });
  await makeOrder({ customerId: c[7], daysAgo: 1, status: "At Factory", carpets: [[3.6, 2.4]], paidRatio: 0.0 });
  await makeOrder({ customerId: c[8], daysAgo: 1, status: "At Factory", carpets: [[2.2, 1.5]], paidRatio: 1.0 });

  await makeOrder({ customerId: c[9], daysAgo: 1, status: "Collected", carpets: [[3.0, 2.5]], paidRatio: 0.0 });
  await makeOrder({ customerId: c[10], daysAgo: 1, status: "Collected", carpets: [[4.0, 3.0], [2.0, 1.5]], paidRatio: 0.5 });

  await makeOrder({ customerId: c[11], daysAgo: 0, status: "New Order", carpets: [[2.5, 1.8]], paidRatio: 0.0, notes: "Requested morning collection" });
  await makeOrder({ customerId: c[0], daysAgo: 0, status: "New Order", carpets: [[3.0, 2.0], [2.0, 1.5]], paidRatio: 0.2 });
  await makeOrder({ customerId: c[2], daysAgo: 0, status: "New Order", carpets: [[4.5, 3.2]], paidRatio: 0.0 });

  const o1 = await makeOrder({ customerId: c[3], daysAgo: 0, status: "Delivered", carpets: [[3.0, 2.0]], paidRatio: 1.0 });
  await supabase.from("orders").update({ delivery_date: daysAgoDate(0) }).eq("id", o1.id);
  const o2 = await makeOrder({ customerId: c[5], daysAgo: 6, status: "Delivered", carpets: [[2.5, 2.0]], paidRatio: 1.0 });
  await supabase.from("orders").update({ delivery_date: daysAgoDate(0) }).eq("id", o2.id);

  const archived = await makeOrder({ customerId: c[6], daysAgo: 40, status: "Delivered", carpets: [[2.0, 1.5]], paidRatio: 1.0 });
  await supabase.from("orders").update({ is_archived: true }).eq("id", archived.id);

  console.log(`Seeded ${customerIds.length} customers and ${orderCounter} orders.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
