import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { enrichOrder, STATUS_LABELS_SQ } from "@/lib/data";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json([]);

  const like = `%${q}%`;

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, customer:customers(*), carpets(*), payments(*)")
    .eq("is_archived", false)
    .or(`order_number.ilike.${like},customer.name.ilike.${like},customer.phone.ilike.${like},customer.address.ilike.${like}`)
    .order("created_at", { ascending: false })
    .limit(15);

  // Supabase's .or() across a joined table isn't directly supported, so fall back
  // to filtering client-side when the relational .or() above doesn't match.
  let matches = orders || [];
  if (error || matches.length === 0) {
    const { data: allOrders } = await supabase
      .from("orders")
      .select("*, customer:customers(*), carpets(*), payments(*)")
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(500);

    const needle = q.toLowerCase();
    matches = (allOrders || []).filter(
      (o) =>
        o.order_number?.toLowerCase().includes(needle) ||
        o.customer?.name?.toLowerCase().includes(needle) ||
        o.customer?.phone?.toLowerCase().includes(needle) ||
        o.customer?.address?.toLowerCase().includes(needle)
    ).slice(0, 15);
  }

  const results = matches.map((o) => {
    const enriched = enrichOrder(o);
    return {
      id: o.id,
      title: `${o.order_number} — ${o.customer?.name || ""}`,
      subtitle: `${STATUS_LABELS_SQ[o.status] || o.status} · €${enriched.total_price.toFixed(2)} · ${o.customer?.phone || ""}`,
      url: `/orders/${o.id}`,
    };
  });

  return NextResponse.json(results);
}
