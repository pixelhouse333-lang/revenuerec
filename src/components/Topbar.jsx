import React, { useEffect } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { loadAllContracts, saveAllContracts } from "../lib/storage.js";

export default function Topbar() {
  const { state, dispatch } = useContract();

  useEffect(() => {
    dispatch({ type: "SET_SAVED_CONTRACTS", list: loadAllContracts() });
  }, [dispatch]);

  function handleSave() {
    if (state.pendingFieldIds.length > 0) {
      const firstField = document.getElementById(state.pendingFieldIds[0]);
      if (firstField) firstField.scrollIntoView({ behavior: "smooth", block: "center" });
      alert(
        state.pendingFieldIds.length +
          " field(s) imported from the contract document still need review. " +
          "Confirm or edit the highlighted fields before saving."
      );
      return;
    }

    const list = loadAllContracts();
    const id = state.contract.contractNumber || state.contract.projectName || String(Date.now());
    const record = { id, ...state.contract, wipEntries: state.wipEntries, savedAt: new Date().toISOString() };
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
    <header className="topbar">
      <div className="topbar-heading">
        <h1>Contracts</h1>
        <p className="topbar-subtitle">Percentage of completion &amp; completed contract inputs</p>
      </div>
      <div className="header-actions">
        <select aria-label="Saved contracts" value={state.currentContractId || ""} onChange={handleSelect}>
          <option value="">Saved contracts…</option>
          {state.savedContracts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.projectName || c.contractNumber || "Untitled contract"}
            </option>
          ))}
        </select>
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
    </header>
  );
}
