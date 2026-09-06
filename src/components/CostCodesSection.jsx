import React, { useState } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { fmtCurrency } from "../lib/format.js";
import { CheckIcon, CloseIcon, TrashIcon } from "./icons.jsx";

export default function CostCodesSection() {
  const { state, dispatch } = useContract();
  const [draft, setDraft] = useState({ code: "", description: "", budgetAmount: "" });

  function updateDraft(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function addCostCode() {
    const code = draft.code.trim();
    const description = draft.description.trim();
    const budgetAmount = parseFloat(draft.budgetAmount);
    if (!code || !description || !budgetAmount || budgetAmount <= 0) return;
    dispatch({
      type: "ADD_COST_CODE",
      costCode: {
        id: "cc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        code,
        description,
        budgetAmount,
      },
    });
    setDraft({ code: "", description: "", budgetAmount: "" });
  }

  const sorted = [...state.costCodes].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const totalBudget = state.costCodes.reduce((sum, c) => sum + c.budgetAmount, 0);

  return (
    <section className="card">
      <div className="card-header-row">
        <h2>Cost codes</h2>
        <span className="wip-total-badge">
          Total budgeted: <strong>{fmtCurrency(totalBudget)}</strong>
        </span>
      </div>
      <p className="field-note import-note">
        The budget breakdown for this contract, by cost code. Import it from the contract's schedule of values
        (via "Import from document" above) or add codes manually — the WIP Schedule tags every cost entry against
        one of these codes so actual costs roll up to the right budget line automatically.
      </p>

      <div className="grid grid-2">
        <label className="field">
          <span>Code</span>
          <input
            type="text"
            className="mono-field"
            placeholder="e.g. 03300"
            value={draft.code}
            onChange={(e) => updateDraft("code", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Description</span>
          <input
            type="text"
            placeholder="e.g. Concrete"
            value={draft.description}
            onChange={(e) => updateDraft("description", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Budgeted amount ($)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={draft.budgetAmount}
            onChange={(e) => updateDraft("budgetAmount", e.target.value)}
          />
        </label>
      </div>
      <button type="button" className="btn btn-primary wip-add-btn" onClick={addCostCode}>
        Add cost code
      </button>

      <div className="wip-table-wrap wip-table-wrap-spaced">
        <table className="wip-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th className="wip-col-amount">Budgeted amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const pending = state.pendingCostCodeIds.includes(c.id);
              return (
                <tr key={c.id} id={c.id} className={pending ? "row-pending" : undefined}>
                  <td className="mono-field">{c.code}</td>
                  <td>
                    {c.description}
                    {pending && (
                      <span className="field-review-actions row-review-actions">
                        <button
                          type="button"
                          className="field-review-btn field-review-confirm"
                          onClick={() => dispatch({ type: "CONFIRM_COST_CODE", id: c.id })}
                          aria-label="Confirm imported cost code"
                          title="Confirm imported cost code"
                        >
                          <CheckIcon />
                        </button>
                        <button
                          type="button"
                          className="field-review-btn field-review-reject"
                          onClick={() => dispatch({ type: "REJECT_COST_CODE", id: c.id })}
                          aria-label="Reject imported cost code"
                          title="Reject imported cost code"
                        >
                          <CloseIcon />
                        </button>
                      </span>
                    )}
                  </td>
                  <td className="wip-col-amount mono-field">{fmtCurrency(c.budgetAmount)}</td>
                  <td>
                    <button
                      type="button"
                      className="wip-row-delete"
                      aria-label="Delete cost code"
                      onClick={() => dispatch({ type: "REMOVE_COST_CODE", id: c.id })}
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
          <p className="wip-empty">No cost codes yet — import them from the contract or add them above.</p>
        )}
      </div>
    </section>
  );
}
