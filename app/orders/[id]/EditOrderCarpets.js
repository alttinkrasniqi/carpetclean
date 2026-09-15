"use client";

import { useMemo, useState } from "react";

let rowIdSeq = 100000;
function newRow(label, length, width) {
  rowIdSeq += 1;
  return { id: rowIdSeq, label: label ?? `Qilimi ${rowIdSeq}`, length, width };
}

export default function EditOrderCarpets({ action, carpets, priceperSqm }) {
  const [price, setPrice] = useState(priceperSqm);
  const [rows, setRows] = useState(() =>
    carpets.length > 0
      ? carpets.map((c) => newRow(c.label, c.length, c.width))
      : [newRow(undefined, "", "")]
  );
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    let sqm = 0;
    rows.forEach((r) => {
      sqm += (parseFloat(r.length) || 0) * (parseFloat(r.width) || 0);
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
    try {
      await action(formData);
    } catch (e) {
      setError(e.message || "Diçka shkoi keq.");
    }
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Ndrysho Qilimat &amp; Çmimin</div>
      {error && <div className="flash flash-error">{error}</div>}
      <form action={handleSubmit}>
        <div style={{ overflowX: "auto" }}>
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
                      <input type="text" name="carpet_label[]" defaultValue={r.label} />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="carpet_length[]"
                        value={r.length}
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
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addRow} style={{ marginBottom: 14 }}>
          + Shto Qilim
        </button>

        <div className="form-group" style={{ maxWidth: 260 }}>
          <label>Çmimi për m² (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="price_per_sqm"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="order-total-box">
          <div className="order-total-label">Total i ri: {totals.sqm.toFixed(2)} m² × çmimi</div>
          <div className="order-total-value">€{totals.total.toFixed(2)}</div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Ruaj Ndryshimet
          </button>
        </div>
      </form>
    </div>
  );
}
