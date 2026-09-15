import PeriodSwitch from "@/components/PeriodSwitch";
import ReportsCharts from "./ReportsCharts";
import { supabase } from "@/lib/supabase";
import { getOrdersInRange } from "@/lib/queries";
import { periodRange, buildPeriodSummary, STATUS_STEPS, STATUS_LABELS_SQ, fmtEUR } from "@/lib/data";

export default async function ReportsPage({ searchParams }) {
  const period = searchParams.period || "month";
  const { start, end } = periodRange(period, searchParams.start, searchParams.end);
  const orders = await getOrdersInRange(start, end);
  const summary = buildPeriodSummary(orders);

  const avgOrderValue = summary.total_orders ? round2(summary.total_revenue / summary.total_orders) : 0;
  const avgSqm = summary.total_orders ? round2(summary.total_sqm / summary.total_orders) : 0;
  const pending = summary.total_orders - summary.delivered;

  // Build day-by-day chart data (capped at 60 points)
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");
  const dayCount = Math.min(Math.max(Math.round((endDate - startDate) / 86400000) + 1, 1), 60);

  const { data: payments } = await supabase
    .from("payments")
    .select("*, order:orders(is_archived)")
    .gte("date", start)
    .lte("date", end);

  const validPayments = (payments || []).filter((p) => p.order && p.order.is_archived === false);

  const labels = [];
  const revenueSeries = [];
  const ordersSeries = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString("sq-AL", { day: "2-digit", month: "short" }));
    const dayRevenue = validPayments.filter((p) => p.date === iso).reduce((s, p) => s + Number(p.amount), 0);
    revenueSeries.push(round2(dayRevenue));
    ordersSeries.push(orders.filter((o) => o.created_at.slice(0, 10) === iso).length);
  }

  const statusCounts = {};
  STATUS_STEPS.forEach((s) => {
    statusCounts[STATUS_LABELS_SQ[s] || s] = orders.filter((o) => o.status === s).length;
  });

  const paidVsUnpaid = {
    Paguar: orders.filter((o) => o.payment_status === "Paid").length,
    Pjesërisht: orders.filter((o) => o.payment_status === "Partially Paid").length,
    Papaguar: orders.filter((o) => o.payment_status === "Unpaid").length,
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Raportet</h1>
          <p className="page-subtitle">
            {new Date(start + "T00:00:00").toLocaleDateString("sq-AL", { day: "2-digit", month: "short", year: "numeric" })} —{" "}
            {new Date(end + "T00:00:00").toLocaleDateString("sq-AL", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <PeriodSwitch period={period} />
      </div>

      <div className="stat-grid">
        <Stat label="Të Ardhurat Totale" value={fmtEUR(summary.total_revenue)} accent="blue" />
        <Stat label="Pagesat e Mbledhura" value={fmtEUR(summary.total_paid)} accent="green" />
        <Stat label="Papaguar" value={fmtEUR(summary.total_unpaid)} accent="amber" />
        <Stat label="Porositë Totale" value={summary.total_orders} />
        <Stat label="m² Totale të Pastruara" value={summary.total_sqm} />
        <Stat label="Vlera Mesatare e Porosisë" value={fmtEUR(avgOrderValue)} />
        <Stat label="m² Mesatare / Porosi" value={avgSqm} />
        <Stat label="Dërguar / Në pritje" value={`${summary.delivered} / ${pending}`} />
      </div>

      <ReportsCharts
        labels={labels}
        revenueSeries={revenueSeries}
        ordersSeries={ordersSeries}
        statusCounts={statusCounts}
        paidVsUnpaid={paidVsUnpaid}
      />
    </>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${accent ? `accent-${accent}` : ""}`}>{value}</div>
    </div>
  );
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
