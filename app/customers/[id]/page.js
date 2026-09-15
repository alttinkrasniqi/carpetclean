import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/queries";
import { fmtEUR, fmtDate, STATUS_LABELS_SQ, PAYMENT_STATUS_LABELS_SQ } from "@/lib/data";

export default async function CustomerDetailPage({ params }) {
  const customer = await getCustomerById(params.id);
  if (!customer) return notFound();

  return (
    <>
      <div className="customer-header">
        <div className="customer-name-row">
          <div className="customer-avatar">{customer.name[0]?.toUpperCase()}</div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              {customer.name}
            </h1>
            <p className="page-subtitle">
              {customer.phone}
              {customer.address ? ` · ${customer.address}` : ""}
            </p>
          </div>
        </div>
        <Link href="/orders/new" className="btn btn-primary">
          + Porosi e Re
        </Link>
      </div>

      <div className="kpi-row">
        <div className="kpi-box">
          <div className="kpi-label">Porositë</div>
          <div className="kpi-value">{customer.order_count}</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-label">Totali i Shpenzuar</div>
          <div className="kpi-value">{fmtEUR(customer.total_spent)}</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-label">Papaguar</div>
          <div className="kpi-value" style={{ color: customer.outstanding_balance > 0 ? "var(--red)" : "var(--green)" }}>
            {fmtEUR(customer.outstanding_balance)}
          </div>
        </div>
        <div className="kpi-box">
          <div className="kpi-label">Porosia e Fundit</div>
          <div className="kpi-value" style={{ fontSize: 15 }}>
            {customer.last_order_date ? fmtDate(customer.last_order_date) : "—"}
          </div>
        </div>
      </div>

      <div className="section-title">Historiku i Porosive</div>
      <div className="table-wrap">
        {customer.orders.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Porosia</th>
                <th>m²</th>
                <th>Totali</th>
                <th>Paguar</th>
                <th>Mbetur</th>
                <th>Pagesa</th>
                <th>Statusi</th>
                <th>Krijuar</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.id}>
                  <td className="cell-strong">
                    <Link href={`/orders/${o.id}`} className="link-plain">
                      {o.order_number}
                    </Link>
                  </td>
                  <td>{o.total_sqm}</td>
                  <td className="cell-strong">{fmtEUR(o.total_price)}</td>
                  <td>{fmtEUR(o.total_paid)}</td>
                  <td>{fmtEUR(o.remaining_balance)}</td>
                  <td>
                    <PayBadge status={o.payment_status} />
                  </td>
                  <td>
                    <span className={`badge ${o.status_badge_class}`}>{STATUS_LABELS_SQ[o.status] || o.status}</span>
                  </td>
                  <td className="cell-muted">{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">Ende s&apos;ka porosi</div>
          </div>
        )}
      </div>
    </>
  );
}

function PayBadge({ status }) {
  if (status === "Paid") return <span className="pay-badge pay-paid">{PAYMENT_STATUS_LABELS_SQ.Paid}</span>;
  if (status === "Partially Paid") return <span className="pay-badge pay-partial">Pjesërisht</span>;
  return <span className="pay-badge pay-unpaid">{PAYMENT_STATUS_LABELS_SQ.Unpaid}</span>;
}
