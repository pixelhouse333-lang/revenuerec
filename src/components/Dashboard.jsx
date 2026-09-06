import React, { useEffect } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { loadAllContracts } from "../lib/storage.js";
import { computeSummary } from "../lib/calculations.js";
import { fmtCurrency, fmtPercent } from "../lib/format.js";

export default function Dashboard() {
  const { state, dispatch } = useContract();

  useEffect(() => {
    dispatch({ type: "SET_SAVED_CONTRACTS", list: loadAllContracts() });
  }, [dispatch]);

  function openContract(record) {
    dispatch({ type: "LOAD_CONTRACT", record });
  }

  function startNewContract() {
    dispatch({ type: "NEW_CONTRACT" });
  }

  const rows = state.savedContracts.map((record) => ({
    record,
    summary: computeSummary(record, record.wipEntries || []),
  }));

  return (
    <div className="tab-panel" data-panel="dashboard">
      <section className="card">
        <div className="card-header-row">
          <h2>Saved contracts</h2>
          <button type="button" className="btn btn-primary" onClick={startNewContract}>
            + New contract
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="wip-empty">
            No contracts saved yet — start a new one, or open the Contracts workspace and import from a document.
          </p>
        ) : (
          <div className="wip-table-wrap">
            <table className="wip-table dashboard-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Contract #</th>
                  <th className="wip-col-amount">Contract value</th>
                  <th className="wip-col-amount">% complete</th>
                  <th>Saved</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ record, summary }) => (
                  <tr key={record.id} className="dashboard-row" onClick={() => openContract(record)}>
                    <td>{record.projectName || "Untitled contract"}</td>
                    <td className="mono-field">{record.contractNumber || "—"}</td>
                    <td className="wip-col-amount mono-field">{fmtCurrency(summary.totalContractValue)}</td>
                    <td className="wip-col-amount mono-field">{fmtPercent(summary.percentComplete)}</td>
                    <td>{record.savedAt ? new Date(record.savedAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <button type="button" className="btn btn-ghost dashboard-open-btn" onClick={() => openContract(record)}>
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
