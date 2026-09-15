export const STATUS_STEPS = [
  "New Order",
  "Collected",
  "At Factory",
  "Cleaning",
  "Ready",
  "Out for Delivery",
  "Delivered",
];

// Displayed labels only — the underlying values (STATUS_STEPS) stay in English
// because they're what's stored in the database and used for filtering/matching.
export const STATUS_LABELS_SQ = {
  "New Order": "Porosi e Re",
  Collected: "Marrë",
  "At Factory": "Në Fabrikë",
  Cleaning: "Duke u Pastruar",
  Ready: "Gati",
  "Out for Delivery": "Në Dërgesë",
  Delivered: "Dërguar",
};

export const PAYMENT_STATUS_LABELS_SQ = {
  Paid: "Paguar",
  "Partially Paid": "Pjesërisht Paguar",
  Unpaid: "Papaguar",
};

export const STATUS_BADGE_CLASS = {
  "New Order": "badge-new",
  Collected: "badge-collected",
  "At Factory": "badge-factory",
  Cleaning: "badge-cleaning",
  Ready: "badge-ready",
  "Out for Delivery": "badge-outfordelivery",
  Delivered: "badge-delivered",
};

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Attach computed totals to a raw order row (with .carpets and .payments arrays joined in)
export function enrichOrder(order) {
  const carpets = (order.carpets || []).map((c) => ({
    ...c,
    area: round2(c.length * c.width),
    carpet_price: round2(c.length * c.width * c.price_per_sqm),
  }));
  const total_sqm = round2(carpets.reduce((sum, c) => sum + c.area, 0));
  const total_price = round2(carpets.reduce((sum, c) => sum + c.carpet_price, 0));
  const payments = order.payments || [];
  const total_paid = round2(payments.reduce((sum, p) => sum + Number(p.amount), 0));
  const remaining_balance = round2(total_price - total_paid);
  let payment_status = "Unpaid";
  if (total_paid > 0 && remaining_balance <= 0.001) payment_status = "Paid";
  else if (total_paid > 0) payment_status = "Partially Paid";

  return {
    ...order,
    carpets,
    payments,
    total_sqm,
    total_price,
    total_paid,
    remaining_balance,
    payment_status,
    status_badge_class: STATUS_BADGE_CLASS[order.status] || "badge-new",
  };
}

export function fmtEUR(n) {
  return `€${(n ?? 0).toFixed(2)}`;
}

export function fmtDate(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
  return date.toLocaleDateString("sq-AL", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function periodRange(period, start, end) {
  const today = new Date();
  const toISO = (d) => d.toISOString().slice(0, 10);
  const todayStr = toISO(today);

  if (period === "today") return { start: todayStr, end: todayStr };

  if (period === "week") {
    const day = (today.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - day);
    return { start: toISO(monday), end: todayStr };
  }

  if (period === "month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: toISO(first), end: todayStr };
  }

  if (period === "year") {
    const first = new Date(today.getFullYear(), 0, 1);
    return { start: toISO(first), end: todayStr };
  }

  if (period === "custom" && start && end) {
    return { start, end };
  }

  return { start: todayStr, end: todayStr };
}

export function buildPeriodSummary(orders) {
  const total_orders = orders.length;
  const total_sqm = round2(orders.reduce((s, o) => s + o.total_sqm, 0));
  const total_revenue = round2(orders.reduce((s, o) => s + o.total_price, 0));
  const total_paid = round2(orders.reduce((s, o) => s + o.total_paid, 0));
  const total_unpaid = round2(orders.reduce((s, o) => s + o.remaining_balance, 0));
  const collected = orders.filter((o) => o.status !== "New Order").length;
  const cleaning = orders.filter((o) => ["At Factory", "Cleaning"].includes(o.status)).length;
  const ready = orders.filter((o) => o.status === "Ready").length;
  const delivered = orders.filter((o) => o.status === "Delivered").length;

  return { total_orders, total_sqm, total_revenue, total_paid, total_unpaid, collected, cleaning, ready, delivered };
}

export function nextOrderNumber(lastId) {
  const n = (lastId || 0) + 1;
  return `ORD-${String(n).padStart(5, "0")}`;
}
