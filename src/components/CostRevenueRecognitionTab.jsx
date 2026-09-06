import React, { useRef } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { NumberField } from "./FormField.jsx";
import { fmtCurrency, fmtPercent } from "../lib/format.js";

export default function CostRevenueRecognitionTab() {
  const { state, dispatch, summary } = useContract();
  const lastKnownEstimate = useRef(state.contract.costToComplete);

  const caption = state.contract.costEstimateUpdatedAt
    ? `Management's estimate — may change as the project progresses. Last revised ${state.contract.costEstimateUpdatedAt}.`
    : "Management's estimate — may change as the project progresses.";

  function handleEstimateBlur(e) {
    if (e.target.value !== lastKnownEstimate.current) {
      lastKnownEstimate.current = e.target.value;
      dispatch({ type: "TOUCH_COST_ESTIMATE", date: new Date().toISOString().slice(0, 10) });
    }
  }

  const wipEntryCount = state.wipEntries.length;

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
            id="costToComplete"
            label="Estimated cost to complete ($)"
            min="0"
            step="0.01"
            placeholder="0.00"
            caption={caption}
            onBlur={handleEstimateBlur}
          />

          <div className="pulled-stat">
            <span className="pulled-stat-label">Total estimated cost at completion</span>
            <span className="pulled-stat-value">{fmtCurrency(summary.totalEstCost)}</span>
            <span className="pulled-stat-source">{fmtPercent(summary.percentComplete)} complete</span>
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
