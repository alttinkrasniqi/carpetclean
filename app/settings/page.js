import { getSettings, getArchivedOrders } from "@/lib/queries";
import { fmtEUR, fmtDate, STATUS_LABELS_SQ } from "@/lib/data";
import { updateSettings, restoreOrder } from "@/app/actions";

export default async function SettingsPage() {
  const settings = await getSettings();
  const archivedOrders = await getArchivedOrders();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cilësimet</h1>
          <p className="page-subtitle">Vlerat standarde të biznesit dhe porositë e arkivuara.</p>
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 520, marginBottom: 26 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Të Përgjithshme</div>
        <form action={updateSettings}>
          <div className="form-group">
            <label>Emri i Biznesit</label>
            <input type="text" name="business_name" defaultValue={settings.business_name} />
          </div>
          <div className="form-group">
            <label>Çmimi Standard për m² (€)</label>
            <input type="number" step="0.01" min="0" name="default_price_per_sqm" defaultValue={settings.default_price_per_sqm} />
            <div className="form-hint">Vlen vetëm për porositë e reja — porositë ekzistuese ruajnë çmimin me të cilin janë krijuar.</div>
          </div>
          <button type="submit" className="btn btn-primary">
            Ruaj Cilësimet
          </button>
        </form>
      </div>

      <div className="section-title">Porositë e Arkivuara</div>
      <div className="table-wrap">
        {archivedOrders.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Porosia</th>
                <th>Klienti</th>
                <th>Totali</th>
                <th>Statusi</th>
                <th>Krijuar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {archivedOrders.map((o) => {
                const boundRestore = restoreOrder.bind(null, o.id);
                return (
                  <tr key={o.id}>
                    <td className="cell-strong">{o.order_number}</td>
                    <td>{o.customer?.name}</td>
                    <td>{fmtEUR(o.total_price)}</td>
                    <td>
                      <span className={`badge ${o.status_badge_class}`}>{STATUS_LABELS_SQ[o.status] || o.status}</span>
                    </td>
                    <td className="cell-muted">{fmtDate(o.created_at)}</td>
                    <td>
                      <form action={boundRestore}>
                        <button type="submit" className="btn btn-secondary btn-sm">
                          Rikthe
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">Nuk ka porosi të arkivuara</div>
            <p>Porositë e arkivuara qëndrojnë këtu dhe mund të rikthehen kurdoherë — raportet historike vazhdojnë t&apos;i numërojnë.</p>
          </div>
        )}
      </div>
    </>
  );
}
