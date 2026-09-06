import React from "react";
import { useContract } from "../context/ContractContext.jsx";
import { fmtCurrency } from "../lib/format.js";

function JournalEntry({ title, note, lines }) {
  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <section className="card">
      <div className="card-header-row">
        <h2>{title}</h2>
        <span className={"je-balance-tag" + (balanced ? " je-balanced" : " je-unbalanced")}>
          {balanced ? "Balanced" : "Out of balance"}
        </span>
      </div>
      {note && <p className="field-note import-note">{note}</p>}
      <div className="wip-table-wrap">
        <table className="wip-table je-table">
          <thead>
            <tr>
              <th>Account</th>
              <th className="wip-col-amount">Debit</th>
              <th className="wip-col-amount">Credit</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td className={line.credit ? "je-credit-account" : undefined}>{line.account}</td>
                <td className="wip-col-amount mono-field">{line.debit ? fmtCurrency(line.debit) : ""}</td>
                <td className="wip-col-amount mono-field">{line.credit ? fmtCurrency(line.credit) : ""}</td>
              </tr>
            ))}
            <tr className="je-total-row">
              <td>Total</td>
              <td className="wip-col-amount mono-field">{fmtCurrency(totalDebit)}</td>
              <td className="wip-col-amount mono-field">{fmtCurrency(totalCredit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function JournalEntries() {
  const { state, summary } = useContract();

  const hasContract =
    state.contract.projectName || state.contract.contractNumber || state.wipEntries.length > 0 || summary.totalContractValue > 0;

  if (!hasContract) {
    return (
      <div className="tab-panel" data-panel="journal">
        <section className="card">
          <h2>Journal entries</h2>
          <p className="wip-empty">
            Open a saved contract from the Dashboard, or start a new one from the Contracts workspace, to see its
            journal entries here.
          </p>
        </section>
      </div>
    );
  }

  const methodLabel = state.contract.method === "poc" ? "percentage of completion" : "completed contract";

  const overbilled = summary.billingDelta > 0.5;
  const underbilled = summary.billingDelta < -0.5;

  return (
    <div className="tab-panel" data-panel="journal">
      <section className="card">
        <h2>Journal entries — {state.contract.projectName || "this contract"}</h2>
        <p className="field-note import-note">
          These reflect the contract's <strong>cumulative position to date</strong>, computed from the same figures
          shown on Cost &amp; Revenue Recognition and the Live Summary — not a prior-period comparison, since this
          app doesn't retain period-by-period snapshots. Post the delta from your last posted balance if you're
          entering these into a general ledger that already carries a prior balance. Method: <strong>{methodLabel}</strong>.
        </p>
      </section>

      <JournalEntry
        title="1. Costs incurred to date"
        note="From the WIP ledger — every vendor bill, payroll, materials, subcontractor, and equipment cost logged against this contract."
        lines={[
          { account: "Construction in Progress (Costs)", debit: summary.costsIncurred },
          { account: "Accounts Payable / Cash", credit: summary.costsIncurred },
        ]}
      />

      <JournalEntry
        title="2. Progress billings to date"
        note="Amounts invoiced to the customer, from Cost & Revenue Recognition → Billing."
        lines={[
          { account: "Accounts Receivable", debit: summary.amountBilled },
          { account: "Billings on Construction Contract", credit: summary.amountBilled },
        ]}
      />

      <JournalEntry
        title="3. Cash collected to date"
        note="Cash actually received from the customer against those billings."
        lines={[
          { account: "Cash", debit: summary.cashCollected },
          { account: "Accounts Receivable", credit: summary.cashCollected },
        ]}
      />

      <JournalEntry
        title="4. Revenue and gross profit recognized to date"
        note={
          (state.contract.method === "poc"
            ? "Percentage-of-completion (cost-to-cost): revenue = % complete × total contract value; profit = revenue − actual costs incurred to date. "
            : "Completed contract: revenue and profit are recognized in full only once the contract reaches 100% complete — both show $0 until then. ") +
          "The two Construction in Progress lines (here and in entry 1) are the same balance-sheet asset, posted from two different sources — cost as it's incurred, profit as it's recognized — not two separate accounts."
        }
        lines={[
          { account: "Cost of Construction (COGS)", debit: summary.costRecognized },
          { account: "Construction in Progress (Profit)", debit: summary.grossProfitRecognized },
          { account: "Revenue from Construction Contract", credit: summary.revenueRecognized },
        ]}
      />

      <section className="card">
        <h2>Balance sheet classification</h2>
        <p className="field-note import-note">
          Construction in Progress (costs + profit recognized) net of Billings determines how the contract sits on
          the balance sheet — this is a presentation reclassification, not a cash-moving entry.
        </p>
        <div className="pulled-stat">
          <span className="pulled-stat-label">
            {overbilled
              ? "Billings in excess of costs and estimated earnings (liability)"
              : underbilled
              ? "Costs and estimated earnings in excess of billings (asset)"
              : "Billings match costs and estimated earnings"}
          </span>
          <span className={"pulled-stat-value" + (overbilled ? " variance-over" : "")}>
            {fmtCurrency(Math.abs(summary.billingDelta))}
          </span>
          <span className="pulled-stat-source">
            Construction in Progress {fmtCurrency(summary.costsIncurred + summary.grossProfitRecognized)} − Billings{" "}
            {fmtCurrency(summary.amountBilled)}
          </span>
        </div>
      </section>
    </div>
  );
}
