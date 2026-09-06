import React from "react";
import { useContract } from "../context/ContractContext.jsx";
import { fmtCurrency, fmtPercent } from "../lib/format.js";

const STATUS_COPY = {
  neutral: { label: "Billings match revenue recognized", value: 0 },
  warning: { label: "Billings in excess of costs (overbilled)" },
  good: { label: "Costs in excess of billings (underbilled)" },
};

export default function LiveSummary() {
  const { summary } = useContract();
  const status = STATUS_COPY[summary.billingStatus];
  const statusValue = summary.billingStatus === "neutral" ? 0 : Math.abs(summary.billingDelta);

  return (
    <aside className="summary-column">
      <div className="card summary-card">
        <h2>Live summary</h2>

        <div className="stat-tile stat-tile-hero">
          <span className="stat-label">Revenue recognized to date</span>
          <span className="stat-value">{fmtCurrency(summary.revenueRecognized)}</span>
        </div>

        <div className="stat-grid">
          <div className="stat-tile">
            <span className="stat-label">% complete</span>
            <span className="stat-value">{fmtPercent(summary.percentComplete)}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Total contract value</span>
            <span className="stat-value">{fmtCurrency(summary.totalContractValue)}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Est. gross profit (total)</span>
            <span className="stat-value">{fmtCurrency(summary.estGrossProfit)}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Gross profit recognized</span>
            <span className="stat-value">{fmtCurrency(summary.grossProfitRecognized)}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Net billings after retainage</span>
            <span className="stat-value">{fmtCurrency(summary.netBillings)}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Remaining backlog</span>
            <span className="stat-value">{fmtCurrency(summary.remainingBacklog)}</span>
          </div>
        </div>

        <div className="status-tile">
          <span className={"status-icon status-" + summary.billingStatus} aria-hidden="true"></span>
          <div>
            <span className="status-label">{status.label}</span>
            <span className="status-value">{fmtCurrency(statusValue)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
