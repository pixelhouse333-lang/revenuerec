import React, { useState } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { wipTotal } from "../lib/calculations.js";
import { fmtCurrency, fmtPercent } from "../lib/format.js";
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
  const [draft, setDraft] = useState({ date: "", category: "vendor", costCodeId: "", payee: "", amount: "" });

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
        costCodeId: draft.costCodeId || null,
        payee: draft.payee.trim(),
        amount,
      },
    });
    setDraft({ date: "", category: draft.category, costCodeId: draft.costCodeId, payee: "", amount: "" });
  }

  const sortedCostCodes = [...state.costCodes].sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true })
  );
  const costCodeById = Object.fromEntries(state.costCodes.map((c) => [c.id, c]));

  const sorted = [...state.wipEntries].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const total = wipTotal(state.wipEntries);

  const subtotals = CATEGORY_OPTIONS.map((opt) => ({
    ...opt,
    sum: state.wipEntries.filter((e) => e.category === opt.value).reduce((s, e) => s + e.amount, 0),
  })).filter((opt) => opt.sum > 0);

  const uncodedTotal = state.wipEntries
    .filter((e) => !e.costCodeId || !costCodeById[e.costCodeId])
    .reduce((s, e) => s + e.amount, 0);

  const budgetRows = sortedCostCodes.map((c) => {
    const actual = state.wipEntries.filter((e) => e.costCodeId === c.id).reduce((s, e) => s + e.amount, 0);
    return {
      ...c,
      actual,
      variance: c.budgetAmount - actual,
      pctUsed: c.budgetAmount > 0 ? actual / c.budgetAmount : 0,
    };
  });

  return (
    <div className="tab-panel" data-panel="wip">
      <section className="card">
        <h2>Add cost entry</h2>
        <p className="field-note import-note">
          Log vendor bills, payroll, materials, subcontractor, and equipment costs as they're incurred, tagged to
          the cost code they belong to. These roll up automatically into Costs Incurred to Date on the Cost &amp;
          Revenue Recognition tab, and into the Budget vs Actual table below — there's nowhere else to type either
          number by hand.
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
            <span>Cost code</span>
            <select value={draft.costCodeId} onChange={(e) => updateDraft("costCodeId", e.target.value)}>
              <option value="">
                {sortedCostCodes.length === 0 ? "No cost codes defined yet" : "Uncoded"}
              </option>
              {sortedCostCodes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.description}
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

      {sortedCostCodes.length > 0 && (
        <section className="card">
          <h2>Budget vs actual by cost code</h2>
          <p className="field-note import-note">
            Budgeted amounts come from the Cost Codes table on Contract Details. Actuals are the sum of every WIP
            entry tagged to that code.
          </p>
          <div className="wip-table-wrap">
            <table className="wip-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th className="wip-col-amount">Budgeted</th>
                  <th className="wip-col-amount">Actual</th>
                  <th className="wip-col-amount">Variance</th>
                  <th className="wip-col-amount">% used</th>
                </tr>
              </thead>
              <tbody>
                {budgetRows.map((row) => (
                  <tr key={row.id}>
                    <td className="mono-field">{row.code}</td>
                    <td>{row.description}</td>
                    <td className="wip-col-amount mono-field">{fmtCurrency(row.budgetAmount)}</td>
                    <td className="wip-col-amount mono-field">{fmtCurrency(row.actual)}</td>
                    <td className={"wip-col-amount mono-field" + (row.variance < 0 ? " variance-over" : "")}>
                      {fmtCurrency(row.variance)}
                    </td>
                    <td className="wip-col-amount mono-field">{fmtPercent(row.pctUsed)}</td>
                  </tr>
                ))}
                {uncodedTotal > 0 && (
                  <tr>
                    <td className="mono-field">—</td>
                    <td>Uncoded entries</td>
                    <td className="wip-col-amount mono-field">—</td>
                    <td className="wip-col-amount mono-field">{fmtCurrency(uncodedTotal)}</td>
                    <td className="wip-col-amount mono-field">—</td>
                    <td className="wip-col-amount mono-field">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
                <th>Cost code</th>
                <th>Payee / description</th>
                <th className="wip-col-amount">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => {
                const costCode = entry.costCodeId ? costCodeById[entry.costCodeId] : null;
                return (
                  <tr key={entry.id}>
                    <td>{entry.date || "—"}</td>
                    <td>{CATEGORY_LABELS[entry.category] || entry.category}</td>
                    <td className="mono-field">{costCode ? `${costCode.code} — ${costCode.description}` : "Uncoded"}</td>
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
                );
              })}
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
