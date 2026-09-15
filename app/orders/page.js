import Link from "next/link";
import { getAllActiveOrders } from "@/lib/queries";
import { fmtEUR, fmtDate, STATUS_LABELS_SQ, PAYMENT_STATUS_LABELS_SQ } from "@/lib/data";
import { deleteOrder } from "@/app/actions";
import ConfirmForm from "@/components/ConfirmForm";

const FILTERS = [
  { key: "all", label: "Të Gjitha" },
  { key: "New Order", label: "Porosi e Re" },
  { key: "Collected", label: "Marrë" },
  { key: "at_factory", label: "Në Fabrikë" },
  { key: "Cleaning", label: "Duke u Pastruar" },
  { key: "ready", label: "Gati" },
  { key: "Out for Delivery", label: "Në Dërgesë" },
  { key: "undelivered", label: "Të Padërguara" },
  { key: "delivered", label: "Dërguar" },
];

function applyFilter(orders, statusFilter) {
  switch (statusFilter) {
    case "at_factory":
      return orders.filter((o) => o.status === "At Factory");
    case "ready":
      return orders.filter((o) => o.status === "Ready");
    case "undelivered":
      return orders.filter((o) => o.status !== "Delivered");
    case "delivered":
      return orders.filter((o) => o.status === "Delivered");
    case "all":
      return orders;
    default:
      return orders.filter((o) => o.status === statusFilter);
  }
}

export default async function OrdersPage({ searchParams }) {
  const statusFilter = searchParams.status || "all";
  const allOrders = await getAllActiveOrders();
  const orders = applyFilter(allOrders, statusFilter);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Porositë</h1>
          <p className="page-subtitle">{orders.length} porosi</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary">
          + Porosi e Re
        </Link>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/orders?status=${encodeURIComponent(f.key)}`}
            className={`filter-chip ${statusFilter === f.key ? "active" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="table-wrap">
        {orders.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Porosia</th>
                <th>Klienti</th>
                <th>Telefoni</th>
                <th>m²</th>
                <th>Totali</th>
                <th>Paguar</th>
                <th>Mbetur</th>
                <th>Pagesa</th>
                <th>Statusi</th>
                <th>Krijuar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const boundDelete = deleteOrder.bind(null, o.id);
                return (
                <tr key={o.id}>
                  <td className="cell-strong">
                    <Link href={`/orders/${o.id}`} className="link-plain">
                      {o.order_number}
                    </Link>
                  </td>
                  <td>{o.customer?.name}</td>
                  <td className="cell-muted">{o.customer?.phone}</td>
                  <td>{o.total_sqm}</td>
                  <td className="cell-strong">{fmtEUR(o.total_price)}</td>
                  <td>{fmtEUR(o.total_paid)}</td>
                  <td className={o.remaining_balance > 0 ? "cell-strong" : "cell-muted"}>
                    {fmtEUR(o.remaining_balance)}
                  </td>
                  <td>
                    <PayBadge status={o.payment_status} />
                  </td>
                  <td>
                    <span className={`badge ${o.status_badge_class}`}>{STATUS_LABELS_SQ[o.status] || o.status}</span>
                  </td>
                  <td className="cell-muted">{fmtDate(o.created_at)}</td>
                  <td>
                    <ConfirmForm
                      action={boundDelete}
                      confirmText={`Me fshi PËRGJITHMONË porosinë ${o.order_number}? Nuk ka kthim mbrapa.`}
                    >
                      <button type="submit" className="btn btn-danger btn-sm">
                        Fshi
                      </button>
                    </ConfirmForm>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">Asnjë porosi nuk përputhet me këtë filter</div>
            <p>Provo një filtër tjetër ose krijo një porosi të re.</p>
          </div>
        )}
      </div>
    </>
  );
}

function PayBadge({ status }) {
  if (status === "Paid") return <span className="pay-badge pay-paid">{PAYMENT_STATUS_LABELS_SQ.Paid}</span>;
  if (status === "Partially Paid")
    return <span className="pay-badge pay-partial">Pjesërisht</span>;
  return <span className="pay-badge pay-unpaid">{PAYMENT_STATUS_LABELS_SQ.Unpaid}</span>;
}
