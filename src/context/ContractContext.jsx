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
  totalEstimatedCost: "",
  costEstimateUpdatedAt: null,
  amountBilled: "",
  cashCollected: "",
  method: "poc",
};

const initialState = {
  contract: { ...emptyContract },
  wipEntries: [],
  costCodes: [],
  pendingCostCodeIds: [],
  activeView: "dashboard",
  activeTab: "details",
  pendingFieldIds: [],
  pendingSnapshot: {},
  savedContracts: [],
  currentContractId: null,
};

// Total Estimated Cost at Completion starts out equal to the cost-code
// budget total and stays in sync with it - UNLESS management has
// explicitly revised the estimate (tracked by costEstimateUpdatedAt),
// at which point it's frozen and only changes on a further manual edit.
function withSeededEstimate(state) {
  if (state.contract.costEstimateUpdatedAt) return state;
  const budgetTotal = state.costCodes.reduce((sum, c) => sum + c.budgetAmount, 0);
  if (budgetTotal <= 0) return state;
  return { ...state, contract: { ...state.contract, totalEstimatedCost: budgetTotal } };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD": {
      const contract = { ...state.contract, [action.field]: action.value };
      const pendingFieldIds = state.pendingFieldIds.filter((id) => id !== action.field);
      const pendingSnapshot = { ...state.pendingSnapshot };
      delete pendingSnapshot[action.field];
      return { ...state, contract, pendingFieldIds, pendingSnapshot };
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
    case "SET_ACTIVE_VIEW":
      return { ...state, activeView: action.view };
    case "APPLY_EXTRACTED": {
      const contract = { ...state.contract, ...action.results };
      const pendingFieldIds = Array.from(new Set([...state.pendingFieldIds, ...Object.keys(action.results)]));
      const pendingSnapshot = { ...state.pendingSnapshot, ...action.snapshot };
      return { ...state, contract, pendingFieldIds, pendingSnapshot };
    }
    case "CONFIRM_FIELD": {
      const pendingFieldIds = state.pendingFieldIds.filter((id) => id !== action.field);
      const pendingSnapshot = { ...state.pendingSnapshot };
      delete pendingSnapshot[action.field];
      return { ...state, pendingFieldIds, pendingSnapshot };
    }
    case "REJECT_FIELD": {
      const contract = { ...state.contract, [action.field]: state.pendingSnapshot[action.field] };
      const pendingFieldIds = state.pendingFieldIds.filter((id) => id !== action.field);
      const pendingSnapshot = { ...state.pendingSnapshot };
      delete pendingSnapshot[action.field];
      return { ...state, contract, pendingFieldIds, pendingSnapshot };
    }
    case "CONFIRM_ALL_PENDING":
      return { ...state, pendingFieldIds: [], pendingSnapshot: {} };
    case "DISCARD_EXTRACTED": {
      const contract = { ...state.contract, ...state.pendingSnapshot };
      return { ...state, contract, pendingFieldIds: [], pendingSnapshot: {} };
    }
    case "SET_SAVED_CONTRACTS":
      return { ...state, savedContracts: action.list };
    case "LOAD_CONTRACT":
      return {
        ...state,
        contract: { ...emptyContract, ...action.record },
        wipEntries: action.record.wipEntries || [],
        costCodes: action.record.costCodes || [],
        pendingCostCodeIds: [],
        currentContractId: action.record.id,
        pendingFieldIds: [],
        pendingSnapshot: {},
        activeView: "contracts",
        activeTab: "details",
      };
    case "NEW_CONTRACT":
      return {
        ...state,
        contract: { ...emptyContract },
        wipEntries: [],
        costCodes: [],
        pendingCostCodeIds: [],
        currentContractId: null,
        pendingFieldIds: [],
        pendingSnapshot: {},
        activeView: "contracts",
        activeTab: "details",
      };
    case "SET_CURRENT_ID":
      return { ...state, currentContractId: action.id };

    // --- Cost codes (budget breakdown) ---------------------------------
    case "ADD_COST_CODE":
      return withSeededEstimate({ ...state, costCodes: [...state.costCodes, action.costCode] });
    case "REMOVE_COST_CODE":
      return withSeededEstimate({
        ...state,
        costCodes: state.costCodes.filter((c) => c.id !== action.id),
        pendingCostCodeIds: state.pendingCostCodeIds.filter((id) => id !== action.id),
      });
    case "SET_COST_CODES":
      return withSeededEstimate({ ...state, costCodes: action.costCodes });
    case "UPDATE_COST_CODE":
      return withSeededEstimate({
        ...state,
        costCodes: state.costCodes.map((c) =>
          c.id === action.id ? { ...c, [action.field]: action.value } : c
        ),
      });
    case "IMPORT_COST_CODES": {
      const costCodes = [...state.costCodes, ...action.costCodes];
      const pendingCostCodeIds = [
        ...state.pendingCostCodeIds,
        ...action.costCodes.map((c) => c.id),
      ];
      return withSeededEstimate({ ...state, costCodes, pendingCostCodeIds });
    }
    case "CONFIRM_COST_CODE":
      return { ...state, pendingCostCodeIds: state.pendingCostCodeIds.filter((id) => id !== action.id) };
    case "REJECT_COST_CODE":
      return withSeededEstimate({
        ...state,
        costCodes: state.costCodes.filter((c) => c.id !== action.id),
        pendingCostCodeIds: state.pendingCostCodeIds.filter((id) => id !== action.id),
      });
    case "CONFIRM_ALL_COST_CODES":
      return { ...state, pendingCostCodeIds: [] };
    case "DISCARD_PENDING_COST_CODES":
      return withSeededEstimate({
        ...state,
        costCodes: state.costCodes.filter((c) => !state.pendingCostCodeIds.includes(c.id)),
        pendingCostCodeIds: [],
      });
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
