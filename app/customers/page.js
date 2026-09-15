import Link from "next/link";
import { getCustomers } from "@/lib/queries";
import { fmtEUR, fmtDate } from "@/lib/data";
import { deleteCustomer } from "@/app/actions";
import ConfirmForm from "@/components/ConfirmForm";

export default async function CustomersPage({ searchParams }) {
  const q = searchParams.q || "";
  const customers = await getCustomers(q);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Klientët</h1>
          <p className="page-subtitle">{customers.length} klientë</p>
        </div>
        <form method="get" style={{ width: 280 }}>
          <input type="text" name="q" defaultValue={q} placeholder="Kërko emër ose telefon..." />
        </form>
      </div>

      <div className="table-wrap">
        {customers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Emri</th>
                <th>Telefoni</th>
                <th>Porositë</th>
                <th>Totali i Shpenzuar</th>
                <th>Papaguar</th>
                <th>Porosia e Fundit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const boundDelete = deleteCustomer.bind(null, c.id);
                return (
                  <tr key={c.id}>
                    <td className="cell-strong">
                      <Link href={`/customers/${c.id}`} className="link-plain">
                        {c.name}
                      </Link>
                    </td>
                    <td className="cell-muted">{c.phone}</td>
                    <td>{c.order_count}</td>
                    <td>{fmtEUR(c.total_spent)}</td>
                    <td className={c.outstanding_balance > 0 ? "cell-strong" : "cell-muted"}>
                      {fmtEUR(c.outstanding_balance)}
                    </td>
                    <td className="cell-muted">{c.last_order_date ? fmtDate(c.last_order_date) : "—"}</td>
                    <td>
                      <ConfirmForm
                        action={boundDelete}
                        confirmText={`Me fshi "${c.name}" dhe krejt porositë e tij/saj (${c.order_count})? Kjo s'kthehet mbrapa.`}
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
            <div className="empty-state-title">Nuk u gjet asnjë klient</div>
            <p>Provo një kërkim tjetër, ose krijo një porosi të re për ta shtuar.</p>
          </div>
        )}
      </div>
    </>
  );
}
