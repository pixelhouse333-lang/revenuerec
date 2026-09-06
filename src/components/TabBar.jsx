import React from "react";
import { useContract } from "../context/ContractContext.jsx";

const TABS = [
  { id: "details", label: "Contract Details" },
  { id: "wip", label: "WIP Schedule" },
  { id: "revrec", label: "Cost & Revenue Recognition" },
];

export default function TabBar() {
  const { state, dispatch } = useContract();

  return (
    <div className="tab-bar" role="tablist" aria-label="Contract workspace">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={"tab-btn" + (state.activeTab === tab.id ? " active" : "")}
          role="tab"
          aria-selected={state.activeTab === tab.id}
          onClick={() => dispatch({ type: "SET_ACTIVE_TAB", tab: tab.id })}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
