import React, { useRef } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { NumberField } from "./FormField.jsx";
import { fmtCurrency, fmtPercent } from "../lib/format.js";

export default function CostRevenueRecognitionTab() {
  const { state, dispatch, summary } = useContract();
  const lastKnownEstimate = useRef(state.contract.totalEstimatedCost);

  const caption = state.contract.costEstimateUpdatedAt
    ? `Management's estimate, set from the contract's cost codes at initiation. Last revised ${state.contract.costEstimateUpdatedAt}.`
    : "Set automatically from the Cost Codes total. Stays fixed until management revises it here — it does not change just because WIP costs come in.";

  function handleEstimateBlur(e) {
    if (e.target.value !== lastKnownEstimate.current) {
      lastKnownEstimate.current = e.target.value;
      dispatch({ type: "TOUCH_COST_ESTIMATE", date: new Date().toISOString().slice(0, 10) });
    }
  }

  const wipEntryCount = state.wipEntries.length;
  const overBudget = summary.costToComplete < 0;

  return (
    <div className="tab-panel" data-panel="revrec">
      <section className="card">
        <h2>Cost summary</h2>
        <div className="grid grid-2">
          <div className="pulled-stat">
            <span className="pulled-stat-label">Total contract value</span>
            <span className="pulled-stat-value">{fmtCurrency(summary.totalContractValue)}</span>
            <span className="pulled-stat-source">From Contract Details</span>
          </div>

          <div className="pulled-stat">
            <span className="pulled-stat-label">Costs incurred to date</span>
            <span className="pulled-stat-value">{fmtCurrency(summary.costsIncurred)}</span>
            <button
              type="button"
              className="pulled-stat-link"
              onClick={() => dispatch({ type: "SET_ACTIVE_TAB", tab: "wip" })}
            >
              From WIP Schedule · {wipEntryCount} {wipEntryCount === 1 ? "entry" : "entries"} →
            </button>
          </div>

          <NumberField
            id="totalEstimatedCost"
            label="Total estimated cost at completion ($)"
            min="0"
            step="0.01"
            placeholder="0.00"
            caption={caption}
            onBlur={handleEstimateBlur}
          />

          <div className="pulled-stat">
            <span className="pulled-stat-label">Estimated cost to complete (remaining)</span>
            <span className={"pulled-stat-value" + (overBudget ? " variance-over" : "")}>
              {fmtCurrency(summary.costToComplete)}
            </span>
            <span className="pulled-stat-source">
              {fmtPercent(summary.percentComplete)} complete{overBudget ? " · over budget" : ""}
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Revenue recognition method</h2>
        <div className="method-toggle" role="radiogroup" aria-label="Revenue recognition method">
          <label className="method-option">
            <input
              type="radio"
              name="method"
              value="poc"
              checked={state.contract.method === "poc"}
              onChange={() => dispatch({ type: "SET_FIELD", field: "method", value: "poc" })}
            />
            <span>
              <strong>Percentage of completion</strong>
              <small>Recognize revenue as work progresses, based on cost-to-cost.</small>
            </span>
          </label>
          <label className="method-option">
            <input
              type="radio"
              name="method"
              value="ccm"
              checked={state.contract.method === "ccm"}
              onChange={() => dispatch({ type: "SET_FIELD", field: "method", value: "ccm" })}
            />
            <span>
              <strong>Completed contract</strong>
              <small>Recognize all revenue only when the contract is substantially complete.</small>
            </span>
          </label>
        </div>
        <p className="method-note">
          {state.contract.method === "poc"
            ? "Percentage of completion: revenue recognized proportionally using the cost-to-cost method (costs incurred ÷ total estimated cost)."
            : "Completed contract: revenue and cost recognition are deferred in full until the contract reaches 100% completion."}
        </p>
      </section>

      <section className="card">
        <h2>Billing</h2>
        <div className="grid grid-2">
          <NumberField id="amountBilled" label="Amount billed to date ($)" min="0" step="0.01" placeholder="0.00" />
          <NumberField id="cashCollected" label="Cash collected to date ($)" min="0" step="0.01" placeholder="0.00" />
        </div>
      </section>
    </div>
  );
}
