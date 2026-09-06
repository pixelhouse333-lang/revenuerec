import React, { createContext, useContext, useMemo, useReducer } from "react";
import { computeSummary } from "../lib/calculations.js";

export const emptyContract = {
  projectName: "",
  contractNumber: "",
  customerName: "",
  contractType: "fixed",
  contractPrice: "",
  changeOrders: "",
  startDate: "",
  endDate: "",
  paymentTerms: "net30",
  retainagePct: "",
  warrantyMonths: "",
  hasLiquidatedDamages: false,
  ldRate: "",
  notes: "",
  costToComplete: "",
  costEstimateUpdatedAt: null,
  amountBilled: "",
  cashCollected: "",
  method: "poc",
};

const initialState = {
  contract: { ...emptyContract },
  wipEntries: [],
  activeTab: "details",
  pendingFieldIds: [],
  savedContracts: [],
  currentContractId: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD": {
      const contract = { ...state.contract, [action.field]: action.value };
      const pendingFieldIds = state.pendingFieldIds.filter((id) => id !== action.field);
      return { ...state, contract, pendingFieldIds };
    }
    case "TOUCH_COST_ESTIMATE":
      return { ...state, contract: { ...state.contract, costEstimateUpdatedAt: action.date } };
    case "ADD_WIP_ENTRY":
      return { ...state, wipEntries: [...state.wipEntries, action.entry] };
    case "REMOVE_WIP_ENTRY":
      return { ...state, wipEntries: state.wipEntries.filter((e) => e.id !== action.id) };
    case "SET_WIP_ENTRIES":
      return { ...state, wipEntries: action.entries };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tab };
    case "APPLY_EXTRACTED": {
      const contract = { ...state.contract, ...action.results };
      const pendingFieldIds = Array.from(new Set([...state.pendingFieldIds, ...Object.keys(action.results)]));
      return { ...state, contract, pendingFieldIds };
    }
    case "CONFIRM_ALL_PENDING":
      return { ...state, pendingFieldIds: [] };
    case "DISCARD_EXTRACTED": {
      const contract = { ...state.contract, ...action.snapshot };
      return { ...state, contract, pendingFieldIds: [] };
    }
    case "SET_SAVED_CONTRACTS":
      return { ...state, savedContracts: action.list };
    case "LOAD_CONTRACT":
      return {
        ...state,
        contract: { ...emptyContract, ...action.record },
        wipEntries: action.record.wipEntries || [],
        currentContractId: action.record.id,
        pendingFieldIds: [],
      };
    case "NEW_CONTRACT":
      return {
        ...state,
        contract: { ...emptyContract },
        wipEntries: [],
        currentContractId: null,
        pendingFieldIds: [],
      };
    case "SET_CURRENT_ID":
      return { ...state, currentContractId: action.id };
    default:
      return state;
  }
}

const ContractCtx = createContext(null);

export function ContractProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const summary = useMemo(
    () => computeSummary(state.contract, state.wipEntries),
    [state.contract, state.wipEntries]
  );

  const value = useMemo(() => ({ state, dispatch, summary }), [state, summary]);

  return <ContractCtx.Provider value={value}>{children}</ContractCtx.Provider>;
}

export function useContract() {
  const ctx = useContext(ContractCtx);
  if (!ctx) throw new Error("useContract must be used within a ContractProvider");
  return ctx;
}
