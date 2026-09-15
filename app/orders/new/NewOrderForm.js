"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createOrder } from "@/app/actions";

let rowIdSeq = 0;
function newRow(length = "", width = "") {
  rowIdSeq += 1;
  return { id: rowIdSeq, label: `Qilimi ${rowIdSeq}`, length, width };
}

export default function NewOrderForm({ customers, defaultPrice, today }) {
  const [customerId, setCustomerId] = useState("__new__");
  const [price, setPrice] = useState(defaultPrice);
  const [rows, setRows] = useState(() => [newRow(3, 2)]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    let sqm = 0;
    rows.forEach((r) => {
      const l = parseFloat(r.length) || 0;
      const w = parseFloat(r.width) || 0;
      sqm += l * w;
    });
    const p = parseFloat(price) || 0;
    return { sqm, total: sqm * p };
  }, [rows, price]);

  function updateRow(id, field, value) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, newRow()]);
  }
  function removeRow(id) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  async function handleSubmit(formData) {
    setError("");
    setSubmitting(true);
    try {
      await createOrder(formData);
    } catch (e) {
      // redirect() throws a special error on success — rethrow those, only show real errors
      if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
      setError(e.message || "Diçka shkoi keq. Provo përsëri.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Porosi e Re</h1>
          <p className="page-subtitle">Plotëso detajet më poshtë — duhet të marrë më pak se një minutë.</p>
        </div>
        <Link href="/orders" className="btn btn-secondary">
          Anulo
        </Link>
      </div>

      {error && <div className="flash flash-error">{error}</div>}

      <form action={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">
            <span className="step-num">1</span> Informacioni i Klientit
          </div>
          <div className="form-grid">
            <div className="form-group full">
              <label>Klienti</label>
              <select
                className="form-select"
                name="customer_id"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="__new__">+ Klient i ri</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.phone}
                  </option>
                ))}
              </select>
            </div>
            {customerId === "__new__" && (
              <>
                <div className="form-group">
                  <label>Emri i Plotë</label>
                  <input type="text" name="new_customer_name" placeholder="p.sh. Elira Krasniqi" required />
                </div>
                <div className="form-group">
                  <label>Numri i Telefonit</label>
                  <input type="tel" name="new_customer_phone" placeholder="p.sh. 044 123 456" required />
                </div>
                <div className="form-group full">
                  <label>Adresa</label>
                  <input type="text" name="new_customer_address" placeholder="Rruga, qyteti" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <span className="step-num">2</span> Matjet e Qilimit
          </div>
          <table className="carpet-table">
            <thead>
              <tr>
                <th style={{ width: "26%" }}>Qilimi</th>
                <th style={{ width: "18%" }}>Gjatësia (m)</th>
                <th style={{ width: "18%" }}>Gjerësia (m)</th>
                <th style={{ width: "16%" }}>Sipërfaqja (m²)</th>
                <th style={{ width: "16%" }}>Çmimi (€)</th>
                <th style={{ width: "6%" }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const area = (parseFloat(r.length) || 0) * (parseFloat(r.width) || 0);
                const rowPrice = area * (parseFloat(price) || 0);
                return (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="text"
                        name="carpet_label[]"
                        defaultValue={r.label}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="carpet_length[]"
                        value={r.length}
                        placeholder="3.00"
                        onChange={(e) => updateRow(r.id, "length", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="carpet_width[]"
                        value={r.width}
                        placeholder="2.00"
                        onChange={(e) => updateRow(r.id, "width", e.target.value)}
                      />
                    </td>
                    <td className="carpet-row-area">{area.toFixed(2)} m²</td>
                    <td>€{rowPrice.toFixed(2)}</td>
                    <td>
                      <span className="carpet-row-remove" onClick={() => removeRow(r.id)} title="Hiq">
                        &times;
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>
            + Shto Qilim
          </button>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <span className="step-num">3</span> Çmimi &amp; Pagesa
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Çmimi për m² (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price_per_sqm"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <div className="form-hint">
                Çmimi standard është €{defaultPrice}/m². Ndrysho këtu për një çmim të veçantë për këtë porosi.
              </div>
            </div>
            <div className="form-group">
              <label>Shuma e Paguar Tani (€) — opsionale</label>
              <input type="number" step="0.01" min="0" name="amount_paid" placeholder="0.00" />
            </div>
          </div>
          <div className="order-total-box">
            <div className="order-total-label">Totali: {totals.sqm.toFixed(2)} m² × çmimi</div>
            <div className="order-total-value">€{totals.total.toFixed(2)}</div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <span className="step-num">4</span> Marrja
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Data e Marrjes</label>
              <input type="date" name="collection_date" defaultValue={today} />
            </div>
            <div className="form-group full">
              <label>Shënime për Marrjen — opsionale</label>
              <input type="text" name="collection_notes" placeholder="p.sh. Merre pas orës 17:00" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <span className="step-num">5</span> Shënime
          </div>
          <div className="form-group full">
            <textarea name="notes" placeholder="Diçka tjetër për t'u shënuar rreth kësaj porosie..." />
          </div>
        </div>

        <div className="form-actions">
          <Link href="/orders" className="btn btn-secondary">
            Anulo
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Duke krijuar..." : "Krijo Porosinë"}
          </button>
        </div>
      </form>
    </>
  );
}
