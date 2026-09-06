import React, { useState } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { wipTotal } from "../lib/calculations.js";
import { fmtCurrency } from "../lib/format.js";
import { TrashIcon } from "./icons.jsx";

const CATEGORY_OPTIONS = [
  { value: "vendor", label: "Vendor bill" },
  { value: "payroll", label: "Payroll" },
  { value: "materials", label: "Materials" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]));

export default function WipScheduleTab() {
  const { state, dispatch } = useContract();
  const [draft, setDraft] = useState({ date: "", category: "vendor", payee: "", amount: "" });

  function updateDraft(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function addEntry() {
    const amount = parseFloat(draft.amount);
    if (!amount || amount <= 0) return;
    dispatch({
      type: "ADD_WIP_ENTRY",
      entry: {
        id: "wip-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        date: draft.date,
        category: draft.category,
        payee: draft.payee.trim(),
        amount,
      },
    });
    setDraft({ date: "", category: draft.category, payee: "", amount: "" });
  }

  const sorted = [...state.wipEntries].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const total = wipTotal(state.wipEntries);

  const subtotals = CATEGORY_OPTIONS.map((opt) => ({
    ...opt,
    sum: state.wipEntries.filter((e) => e.category === opt.value).reduce((s, e) => s + e.amount, 0),
  })).filter((opt) => opt.sum > 0);

  return (
    <div className="tab-panel" data-panel="wip">
      <section className="card">
        <h2>Add cost entry</h2>
        <p className="field-note import-note">
          Log vendor bills, payroll, materials, subcontractor, and equipment costs as they're incurred.
          These roll up automatically into Costs Incurred to Date on the Cost &amp; Revenue Recognition tab —
          there's nowhere else to type that number by hand.
        </p>
        <div className="grid grid-2">
          <label className="field">
            <span>Date</span>
            <input type="date" value={draft.date} onChange={(e) => updateDraft("date", e.target.value)} />
          </label>
          <label className="field">
            <span>Category</span>
            <select value={draft.category} onChange={(e) => updateDraft("category", e.target.value)}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Payee / description</span>
            <input
              type="text"
              placeholder="e.g. ACME Concrete Co."
              value={draft.payee}
              onChange={(e) => updateDraft("payee", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Amount ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={draft.amount}
              onChange={(e) => updateDraft("amount", e.target.value)}
            />
          </label>
        </div>
        <button type="button" className="btn btn-primary wip-add-btn" onClick={addEntry}>
          Add entry
        </button>
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>Cost ledger</h2>
          <span className="wip-total-badge">
            Costs incurred to date: <strong>{fmtCurrency(total)}</strong>
          </span>
        </div>

        {subtotals.length > 0 && (
          <div className="wip-subtotals">
            {subtotals.map((s) => (
              <span key={s.value} className="wip-subtotal-chip">
                {s.label} <strong>{fmtCurrency(s.sum)}</strong>
              </span>
            ))}
          </div>
        )}

        <div className="wip-table-wrap">
          <table className="wip-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Payee / description</th>
                <th className="wip-col-amount">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.date || "—"}</td>
                  <td>{CATEGORY_LABELS[entry.category] || entry.category}</td>
                  <td>{entry.payee || "—"}</td>
                  <td className="wip-col-amount mono-field">{fmtCurrency(entry.amount)}</td>
                  <td>
                    <button
                      type="button"
                      className="wip-row-delete"
                      aria-label="Delete entry"
                      onClick={() => dispatch({ type: "REMOVE_WIP_ENTRY", id: entry.id })}
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <p className="wip-empty">
              No cost entries yet — add vendor bills, payroll, materials, subcontractor, or equipment costs above.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
