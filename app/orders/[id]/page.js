import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/queries";
import { STATUS_STEPS, STATUS_LABELS_SQ, PAYMENT_STATUS_LABELS_SQ, fmtEUR, fmtDate } from "@/lib/data";
import { updateOrderStatus, updateOrderDetails, addPayment, archiveOrder } from "@/app/actions";

export default async function OrderDetailPage({ params }) {
  const order = await getOrderById(params.id);
  if (!order) return notFound();

  const currentIndex = STATUS_STEPS.indexOf(order.status);
  const boundUpdateDetails = updateOrderDetails.bind(null, order.id);
  const boundAddPayment = addPayment.bind(null, order.id);
  const boundArchive = archiveOrder.bind(null, order.id);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{order.order_number}</h1>
          <p className="page-subtitle">
            Krijuar {fmtDate(order.created_at)} ·{" "}
            <Link href={`/customers/${order.customer.id}`} className="link-plain">
              {order.customer.name}
            </Link>
          </p>
        </div>
        <div className="tag-row">
          <Link href="/orders" className="btn btn-secondary">
            Kthehu te Porositë
          </Link>
          <form action={boundArchive}>
            <button type="submit" className="btn btn-danger">
              Arkivo
            </button>
          </form>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-600)", marginBottom: 10 }}>
          Statusi i Porosisë
        </div>
        <div className="status-track">
          {STATUS_STEPS.map((step, i) => {
            const boundUpdate = updateOrderStatus.bind(null, order.id, step);
            let cls = "status-step";
            if (i < currentIndex) cls += " done";
            else if (i === currentIndex) cls += " current";
            return (
              <form action={boundUpdate} key={step} style={{ display: "inline" }}>
                <button type="submit" className={cls}>
                  {STATUS_LABELS_SQ[step] || step}
                </button>
              </form>
            );
          })}
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi-box">
          <div className="kpi-label">m² Totale</div>
          <div className="kpi-value">{order.total_sqm}</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-label">Çmimi / m²</div>
          <div className="kpi-value">{fmtEUR(order.price_per_sqm)}</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-label">Çmimi Total</div>
          <div className="kpi-value">{fmtEUR(order.total_price)}</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-label">Paguar</div>
          <div className="kpi-value" style={{ color: "var(--green)" }}>
            {fmtEUR(order.total_paid)}
          </div>
        </div>
        <div className="kpi-box">
          <div className="kpi-label">Mbetur</div>
          <div className="kpi-value" style={{ color: order.remaining_balance > 0 ? "var(--red)" : "var(--green)" }}>
            {fmtEUR(order.remaining_balance)}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Qilimi</th>
                  <th>Gjatësia</th>
                  <th>Gjerësia</th>
                  <th>Sipërfaqja</th>
                  <th>Çmimi</th>
                </tr>
              </thead>
              <tbody>
                {order.carpets.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-strong">{c.label}</td>
                    <td>{Number(c.length).toFixed(2)} m</td>
                    <td>{Number(c.width).toFixed(2)} m</td>
                    <td>{c.area} m²</td>
                    <td className="cell-strong">{fmtEUR(c.carpet_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Marrja &amp; Dërgesa</div>
            <form action={boundUpdateDetails}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Data e Marrjes</label>
                  <input type="date" name="collection_date" defaultValue={order.collection_date || ""} />
                </div>
                <div className="form-group">
                  <label>Data e Pranimit në Fabrikë</label>
                  <input type="date" name="factory_received_date" defaultValue={order.factory_received_date || ""} />
                </div>
                <div className="form-group">
                  <label>Data e Përfundimit të Pastrimit</label>
                  <input
                    type="date"
                    name="cleaning_completed_date"
                    defaultValue={order.cleaning_completed_date || ""}
                  />
                </div>
                <div className="form-group">
                  <label>Data e Dërgesës</label>
                  <input type="date" name="delivery_date" defaultValue={order.delivery_date || ""} />
                </div>
                <div className="form-group">
                  <label>Shënime për Marrjen</label>
                  <input type="text" name="collection_notes" defaultValue={order.collection_notes || ""} />
                </div>
                <div className="form-group">
                  <label>Shënime për Dërgesën</label>
                  <input type="text" name="delivery_notes" defaultValue={order.delivery_notes || ""} />
                </div>
                <div className="form-group full">
                  <label>Shënime për Porosinë</label>
                  <textarea name="notes" defaultValue={order.notes || ""} />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Ruaj Detajet
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Klienti</div>
            <div className="info-row">
              <span className="k">Emri</span>
              <span className="v">{order.customer.name}</span>
            </div>
            <div className="info-row">
              <span className="k">Telefoni</span>
              <span className="v">{order.customer.phone}</span>
            </div>
            <div className="info-row">
              <span className="k">Adresa</span>
              <span className="v">{order.customer.address || "—"}</span>
            </div>
          </div>

          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              Pagesat
              <PayBadge status={order.payment_status} />
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${order.total_price ? (order.total_paid / order.total_price) * 100 : 0}%` }}
              />
            </div>
            <div className="form-hint" style={{ marginBottom: 14 }}>
              {fmtEUR(order.total_paid)} nga {fmtEUR(order.total_price)} paguar
            </div>

            <ul className="payment-list">
              {order.payments.length === 0 && <li className="work-empty">Ende s&apos;ka pagesa të regjistruara</li>}
              {[...order.payments]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((p) => (
                  <li key={p.id}>
                    <span>
                      {fmtDate(p.date)}
                      {p.note ? ` — ${p.note}` : ""}
                    </span>
                    <span className="cell-strong">{fmtEUR(p.amount)}</span>
                  </li>
                ))}
            </ul>

            {order.remaining_balance > 0 && (
              <>
                <div className="divider"></div>
                <form action={boundAddPayment}>
                  <div className="form-group">
                    <label>Regjistro Pagesë (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={order.remaining_balance}
                      name="amount"
                      placeholder={`p.sh. ${order.remaining_balance}`}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Shënim — opsional</label>
                    <input type="text" name="note" placeholder="p.sh. Para në dorë" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">
                    Regjistro Pagesën
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PayBadge({ status }) {
  if (status === "Paid") return <span className="pay-badge pay-paid">{PAYMENT_STATUS_LABELS_SQ.Paid}</span>;
  if (status === "Partially Paid") return <span className="pay-badge pay-partial">Pjesërisht</span>;
  return <span className="pay-badge pay-unpaid">{PAYMENT_STATUS_LABELS_SQ.Unpaid}</span>;
}
