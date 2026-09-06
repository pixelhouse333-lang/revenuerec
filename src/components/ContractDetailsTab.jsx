import React, { useMemo, useState } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { TextField, NumberField, DateField, SelectField, TextAreaField, CheckboxField } from "./FormField.jsx";
import { UploadIcon } from "./icons.jsx";
import { contractPeriodText } from "../lib/calculations.js";
import { fmtCurrency } from "../lib/format.js";
import ImportModal from "./ImportModal.jsx";
import CostCodesSection from "./CostCodesSection.jsx";

const CONTRACT_TYPE_OPTIONS = [
  { value: "fixed", label: "Fixed price" },
  { value: "cost-plus", label: "Cost-plus" },
  { value: "t-and-m", label: "Time & material" },
  { value: "unit-price", label: "Unit price" },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "net30", label: "Net 30" },
  { value: "net45", label: "Net 45" },
  { value: "net60", label: "Net 60" },
  { value: "milestone", label: "Milestone-based" },
];

export default function ContractDetailsTab() {
  const { state, summary } = useContract();
  const [importOpen, setImportOpen] = useState(false);
  const periodText = useMemo(
    () => contractPeriodText(state.contract.startDate, state.contract.endDate),
    [state.contract.startDate, state.contract.endDate]
  );

  return (
    <div className="tab-panel" data-panel="details">
      <section className="card">
        <div className="card-header-row">
          <h2>Contract details</h2>
          <button type="button" className="btn btn-ghost btn-import" onClick={() => setImportOpen(true)}>
            <UploadIcon className="btn-icon" />
            <span>Import from document</span>
          </button>
        </div>
        <div className="grid grid-2">
          <TextField id="projectName" label="Project name" placeholder="e.g. Riverside Medical Center" />
          <TextField id="contractNumber" label="Contract number" mono placeholder="e.g. CN-2026-014" />
          <TextField id="customerName" label="Customer / owner" placeholder="e.g. Meridian Health System" />
          <SelectField id="contractType" label="Contract type" options={CONTRACT_TYPE_OPTIONS} />
          <NumberField id="contractPrice" label="Original contract price ($)" min="0" step="0.01" placeholder="0.00" />
          <NumberField id="changeOrders" label="Approved change orders ($)" min="0" step="0.01" placeholder="0.00" />
          <DateField id="startDate" label="Contract start date" />
          <DateField id="endDate" label="Contract end date" />
        </div>
        <div className="grid grid-2 contract-derived-row">
          <div className="pulled-stat">
            <span className="pulled-stat-label">Total contract value</span>
            <span className="pulled-stat-value">{fmtCurrency(summary.totalContractValue)}</span>
            <span className="pulled-stat-source">Original price + approved change orders</span>
          </div>
          <div className="pulled-stat">
            <span className="pulled-stat-label">Contract period</span>
            <span className="pulled-stat-value">{periodText}</span>
            <span className="pulled-stat-source">Inferred from start and end date</span>
          </div>
        </div>
      </section>

      <CostCodesSection />

      <section className="card">
        <h2>Payment terms</h2>
        <div className="grid grid-2">
          <SelectField id="paymentTerms" label="Payment terms" options={PAYMENT_TERMS_OPTIONS} />
          <NumberField id="retainagePct" label="Retainage withheld (%)" min="0" max="100" step="0.1" placeholder="0.0" />
        </div>
      </section>

      <section className="card">
        <h2>Other terms</h2>
        <div className="grid grid-2">
          <NumberField id="warrantyMonths" label="Warranty period (months)" min="0" step="1" placeholder="0" />
          <CheckboxField id="hasLiquidatedDamages" label="Liquidated damages clause" />
          {state.contract.hasLiquidatedDamages && (
            <NumberField id="ldRate" label="Liquidated damages rate ($/day)" min="0" step="0.01" placeholder="0.00" />
          )}
        </div>
        <TextAreaField
          id="notes"
          label="Notes"
          rows={3}
          placeholder="Bonding requirements, retainage release terms, unusual clauses…"
        />
      </section>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}
