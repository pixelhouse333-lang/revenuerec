import { useCallback, useState } from "react";
import { useContract } from "../context/ContractContext.jsx";
import { extractTextFromFile } from "../lib/documentReader.js";
import { parseContractText } from "../lib/ocrParser.js";
import { parseCostCodes } from "../lib/costCodeParser.js";

export function useOcrImport() {
  const { state, dispatch } = useContract();
  const [status, setStatusState] = useState(null); // { text, error } | null
  const [result, setResult] = useState(null); // { summary, filename, extractedText } | null

  const processFile = useCallback(
    async (file) => {
      if (!file) return;
      setResult(null);
      setStatusState({ text: "Reading document…", error: false });

      const setStatus = (text) => setStatusState({ text, error: false });

      try {
        const text = await extractTextFromFile(file, setStatus);
        const { results, summary } = parseContractText(text);
        const rawCostCodes = parseCostCodes(text);

        if (summary.length === 0 && rawCostCodes.length === 0) {
          setStatusState({
            text: "No recognizable contract fields found — try a clearer scan, or enter details manually.",
            error: true,
          });
          return;
        }

        if (Object.keys(results).length > 0) {
          const snapshot = {};
          Object.keys(results).forEach((id) => {
            snapshot[id] = state.contract[id];
          });
          dispatch({ type: "APPLY_EXTRACTED", results, snapshot });
        }

        let costCodes = [];
        if (rawCostCodes.length > 0) {
          costCodes = rawCostCodes.map((c, i) => ({
            id: "cc-" + Date.now() + "-" + i,
            ...c,
          }));
          dispatch({ type: "IMPORT_COST_CODES", costCodes });
        }

        dispatch({ type: "SET_ACTIVE_TAB", tab: "details" });
        setResult({
          summary,
          costCodeCount: costCodes.length,
          filename: file.name,
          extractedText: text.slice(0, 20000),
        });
        setStatusState(null);
      } catch (err) {
        setStatusState({ text: "Couldn't read this file. Try a clearer scan or a text-based PDF.", error: true });
      }
    },
    [dispatch, state.contract]
  );

  function confirmAll() {
    dispatch({ type: "CONFIRM_ALL_PENDING" });
    dispatch({ type: "CONFIRM_ALL_COST_CODES" });
    setResult(null);
  }

  function discardAll() {
    dispatch({ type: "DISCARD_EXTRACTED" });
    dispatch({ type: "DISCARD_PENDING_COST_CODES" });
    setResult(null);
  }

  return { status, result, processFile, confirmAll, discardAll };
}
