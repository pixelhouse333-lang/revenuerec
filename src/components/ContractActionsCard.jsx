import React, { useEffect } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { loadAllContracts, saveAllContracts } from "../lib/storage.js";

export default function ContractActionsCard() {
  const { state, dispatch } = useContract();

  useEffect(() => {
    dispatch({ type: "SET_SAVED_CONTRACTS", list: loadAllContracts() });
  }, [dispatch]);

  function handleSave() {
    if (state.pendingFieldIds.length > 0 || state.pendingCostCodeIds.length > 0) {
      const firstId = state.pendingFieldIds[0] || state.pendingCostCodeIds[0];
      const firstEl = document.getElementById(firstId);
      if (firstEl) firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
      const parts = [];
      if (state.pendingFieldIds.length > 0) parts.push(state.pendingFieldIds.length + " field(s)");
      if (state.pendingCostCodeIds.length > 0) parts.push(state.pendingCostCodeIds.length + " cost code(s)");
      alert(
        parts.join(" and ") +
          " imported from the contract document still need review. " +
          "Confirm or edit the highlighted items before saving."
      );
      return;
    }

    const list = loadAllContracts();
    const id = state.contract.contractNumber || state.contract.projectName || String(Date.now());
    const record = {
      id,
      ...state.contract,
      wipEntries: state.wipEntries,
      costCodes: state.costCodes,
      savedAt: new Date().toISOString(),
    };
    const existingIndex = list.findIndex((c) => c.id === id);
    if (existingIndex >= 0) list[existingIndex] = record;
    else list.push(record);
    saveAllContracts(list);
    dispatch({ type: "SET_SAVED_CONTRACTS", list });
    dispatch({ type: "SET_CURRENT_ID", id });
  }

  function handleNew() {
    dispatch({ type: "NEW_CONTRACT" });
  }

  function handleDelete() {
    if (!state.currentContractId) return;
    const list = loadAllContracts().filter((c) => c.id !== state.currentContractId);
    saveAllContracts(list);
    dispatch({ type: "SET_SAVED_CONTRACTS", list });
    dispatch({ type: "NEW_CONTRACT" });
  }

  function handleSelect(e) {
    const id = e.target.value;
    if (!id) return;
    const record = state.savedContracts.find((c) => c.id === id);
    if (record) dispatch({ type: "LOAD_CONTRACT", record });
  }

  return (
    <div className="card contract-actions-card">
      <h2>This contract</h2>
      <label className="field">
        <span>Saved contracts</span>
        <select aria-label="Saved contracts" value={state.currentContractId || ""} onChange={handleSelect}>
          <option value="">Saved contracts…</option>
          {state.savedContracts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.projectName || c.contractNumber || "Untitled contract"}
            </option>
          ))}
        </select>
      </label>
      <div className="contract-actions-buttons">
        <button type="button" className="btn btn-ghost" onClick={handleDelete}>
          Delete
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleNew}>
          New
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          Save contract
        </button>
      </div>
    </div>
  );
}
