import { num } from "./format.js";

export function wipTotal(wipEntries) {
  return wipEntries.reduce((sum, e) => sum + e.amount, 0);
}

export function contractPeriodText(startDate, endDate) {
  if (!startDate || !endDate) return "—";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  if (days < 0) return "End date is before start date";
  const months = Math.round((days / 30.44) * 10) / 10;
  return `${days.toLocaleString()} days (~${months} months)`;
}

/**
 * Central revenue-recognition math.
 *
 * Costs incurred to date always comes from the WIP ledger (single source
 * of truth) — never from a hand-typed field. Total Estimated Cost at
 * Completion is the other, independent half: a management judgment call
 * that starts out equal to the contract's cost-code budget and stays
 * fixed until management explicitly revises it — it is NOT recalculated
 * just because more WIP costs come in. Estimated Cost to Complete
 * (the remaining work) is therefore derived, not entered directly:
 * Total Estimated Cost − Costs Incurred to Date.
 */
export function computeSummary(contract, wipEntries) {
  const contractPrice = num(contract.contractPrice);
  const changeOrders = num(contract.changeOrders);
  const totalContractValue = contractPrice + changeOrders;

  const costsIncurred = wipTotal(wipEntries);
  const totalEstCost = num(contract.totalEstimatedCost);
  const costToComplete = totalEstCost - costsIncurred;

  const percentComplete = totalEstCost > 0 ? costsIncurred / totalEstCost : 0;
  const estGrossProfit = totalContractValue - totalEstCost;

  let revenueRecognized;
  let costRecognized;
  if (contract.method === "poc") {
    revenueRecognized = percentComplete * totalContractValue;
    costRecognized = costsIncurred;
  } else {
    const complete = percentComplete >= 1;
    revenueRecognized = complete ? totalContractValue : 0;
    costRecognized = complete ? totalEstCost : 0;
  }
  const grossProfitRecognized = revenueRecognized - costRecognized;

  const amountBilled = num(contract.amountBilled);
  const retainagePct = num(contract.retainagePct);
  const netBillings = amountBilled * (1 - retainagePct / 100);

  const remainingBacklog = totalContractValue - revenueRecognized;
  const billingDelta = amountBilled - revenueRecognized;

  let billingStatus = "neutral";
  if (Math.abs(billingDelta) >= 0.5) {
    billingStatus = billingDelta > 0 ? "warning" : "good";
  }

  return {
    totalContractValue,
    costsIncurred,
    costToComplete,
    totalEstCost,
    percentComplete,
    estGrossProfit,
    revenueRecognized,
    grossProfitRecognized,
    netBillings,
    remainingBacklog,
    billingDelta,
    billingStatus,
  };
}
