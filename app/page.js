import Link from "next/link";
import PeriodSwitch from "@/components/PeriodSwitch";
import { getAllActiveOrders, getOrdersInRange, getPaymentsOnDate } from "@/lib/queries";
import { periodRange, buildPeriodSummary, todayISO, fmtEUR } from "@/lib/data";

export default async function DashboardPage({ searchParams }) {
  const today = todayISO();
  const allOrders = await getAllActiveOrders();

  const ordersToday = allOrders.filter((o) => o.created_at.slice(0, 10) === today);
  const collectedToday = allOrders.filter((o) => o.collection_date === today);
  const atFactory = allOrders.filter((o) => o.status === "At Factory");
  const readyForDelivery = allOrders.filter((o) => o.status === "Ready");
  const deliveredToday = allOrders.filter((o) => o.delivery_date === today && o.status === "Delivered");
  const waitingDelivery = allOrders.filter((o) => o.status !== "Delivered");
  const outForDelivery = allOrders.filter((o) => o.status === "Out for Delivery");
  const unpaidOrders = allOrders.filter((o) => o.payment_status !== "Paid");
  const scheduledCollectionsToday = allOrders.filter((o) => o.collection_date === today);

  const paymentsToday = await getPaymentsOnDate(today);
  const revenueToday = paymentsToday.reduce((s, p) => s + Number(p.amount), 0);

  const period = searchParams.period || "today";
  const { start, end } = periodRange(period, searchParams.start, searchParams.end);
  const periodOrders = await getOrdersInRange(start, end);
  const summary = buildPeriodSummary(periodOrders);

  const startLabel = new Date(start + "T00:00:00").toLocaleDateString("sq-AL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Paneli</h1>
          <p className="page-subtitle">Pamja e sotme — {startLabel}</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary">
          + Porosi e Re
        </Link>
      </div>

      <div className="stat-grid">
        <StatCard label="Porositë e Pranuara Sot" value={ordersToday.length} />
        <StatCard label="Tepiha sot" value={collectedToday.length} />
        <StatCard label="Aktualisht në Fabrikë" value={atFactory.length} accent="amber" />
        <StatCard label="Gati për Dërgesë" value={readyForDelivery.length} accent="green" />
        <StatCard label="Dërguar Sot" value={deliveredToday.length} />
        <StatCard label="Në Pritje për Dërgesë" value={waitingDelivery.length} />
        <StatCard label="Pagesat e Pranuara Sot" value={paymentsToday.length} />
        <StatCard label="Të Ardhurat Totale Sot" value={fmtEUR(revenueToday)} accent="blue" />
      </div>

      <div className="section-title">Puna e Sotme</div>
      <div className="work-grid">
        <WorkCard title="Marrjet e Sotme" orders={scheduledCollectionsToday} />
        <WorkCard title="Gati për Dërgesë" orders={readyForDelivery} />
        <WorkCard title="Në Dërgesë" orders={outForDelivery} />
        <WorkCard title="Porositë e Papaguara" orders={unpaidOrders} showBalance />
      </div>

      <div className="section-title" style={{ marginTop: 36 }}>
        Përmbledhje e Biznesit
        <PeriodSwitch period={period} />
      </div>

      <div className="stat-grid">
        <StatCard label="Porositë Totale" value={summary.total_orders} />
        <StatCard label="m² Totale të Pastruara" value={summary.total_sqm} />
        <StatCard label="Të Ardhurat Totale" value={fmtEUR(summary.total_revenue)} accent="blue" />
        <StatCard label="Totali i Paguar" value={fmtEUR(summary.total_paid)} accent="green" />
        <StatCard label="Totali i Papaguar" value={fmtEUR(summary.total_unpaid)} accent="amber" />
        <StatCard label="Marrë" value={summary.collected} />
        <StatCard label="Duke u Pastruar" value={summary.cleaning} />
        <StatCard label="Dërguar" value={summary.delivered} />
      </div>
    </>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${accent ? `accent-${accent}` : ""}`}>{value}</div>
    </div>
  );
}

function WorkCard({ title, orders, showBalance }) {
  return (
    <div className="work-card">
      <div className="work-card-title">
        {title} <span className="work-card-count">{orders.length}</span>
      </div>
      <ul className="work-list">
        {orders.length === 0 && <li className="work-empty">Asgjë këtu</li>}
        {orders.slice(0, 6).map((o) => (
          <li key={o.id}>
            <Link href={`/orders/${o.id}`}>
              {o.order_number} — {o.customer?.name}
              {showBalance ? ` (${fmtEUR(o.remaining_balance)})` : ""}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
