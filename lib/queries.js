import { supabase } from "@/lib/supabase";
import { enrichOrder } from "@/lib/data";

const ORDER_SELECT = "*, customer:customers(*), carpets(*), payments(*)";

export async function getAllActiveOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(enrichOrder);
}

export async function getOrdersInRange(start, end) {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("is_archived", false)
    .gte("created_at", `${start}T00:00:00`)
    .lte("created_at", `${end}T23:59:59`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(enrichOrder);
}

export async function getOrderById(id) {
  const { data, error } = await supabase.from("orders").select(ORDER_SELECT).eq("id", id).single();
  if (error) {
    console.error("getOrderById error for id=" + id + ":", JSON.stringify(error));
    return null;
  }
  return enrichOrder(data);
}

export async function getArchivedOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("is_archived", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(enrichOrder);
}

export async function getCustomers(q) {
  let query = supabase.from("customers").select("*, orders(*, carpets(*), payments(*))").order("name");
  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((c) => {
    const activeOrders = (c.orders || []).filter((o) => !o.is_archived).map(enrichOrder);
    const total_spent = round2(activeOrders.reduce((s, o) => s + o.total_paid, 0));
    const outstanding_balance = round2(activeOrders.reduce((s, o) => s + o.remaining_balance, 0));
    const last_order_date =
      activeOrders.length > 0
        ? activeOrders.reduce((latest, o) => (o.created_at > latest ? o.created_at : latest), activeOrders[0].created_at)
        : null;
    return {
      ...c,
      order_count: activeOrders.length,
      total_spent,
      outstanding_balance,
      last_order_date,
    };
  });
}

export async function getCustomerById(id) {
  const { data, error } = await supabase
    .from("customers")
    .select("*, orders(*, carpets(*), payments(*))")
    .eq("id", id)
    .single();
  if (error) {
    console.error("getCustomerById error for id=" + id + ":", JSON.stringify(error));
    return null;
  }

  const activeOrders = (data.orders || [])
    .filter((o) => !o.is_archived)
    .map(enrichOrder)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total_spent = round2(activeOrders.reduce((s, o) => s + o.total_paid, 0));
  const outstanding_balance = round2(activeOrders.reduce((s, o) => s + o.remaining_balance, 0));
  const last_order_date = activeOrders[0]?.created_at || null;

  return {
    ...data,
    orders: activeOrders,
    order_count: activeOrders.length,
    total_spent,
    outstanding_balance,
    last_order_date,
  };
}

export async function getSettings() {
  const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
  return data || { business_name: "Carpet Cleaning Co.", default_price_per_sqm: 1.5 };
}

export async function getPaymentsOnDate(dateStr) {
  const { data, error } = await supabase
    .from("payments")
    .select("*, order:orders(is_archived)")
    .eq("date", dateStr);
  if (error) return [];
  return (data || []).filter((p) => p.order && p.order.is_archived === false);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
