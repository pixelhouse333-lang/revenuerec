import React, { useEffect, useState } from "react";
import { CloseIcon, UploadIcon } from "./icons.jsx";
import { useOcrImport } from "../hooks/useOcrImport.js";

export default function ImportModal({ onClose }) {
  const [visible, setVisible] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { status, result, processFile, confirmAll, discardAll } = useOcrImport();

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  function handleFileChange(e) {
    processFile(e.target.files[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  }

  function handleConfirm() {
    confirmAll();
    requestClose();
  }

  function handleDiscard() {
    discardAll();
    requestClose();
  }

  const dropzoneClass =
    "dropzone" + (dragActive ? " dropzone-active" : "") + (status && !status.error ? " dropzone-busy" : "");

  return (
    <div
      className={"modal-overlay" + (visible ? " is-visible" : "")}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="importModalTitle">
        <div className="modal-header">
          <h2 id="importModalTitle">Import from contract document</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={requestClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <p className="field-note import-note">
            Upload the signed contract (PDF or photo) to auto-fill the fields on the form. Extracted values are
            highlighted for review — nothing is saved until a human confirms them.
          </p>

          <label
            className={dropzoneClass}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" hidden onChange={handleFileChange} />
            <UploadIcon className="dropzone-icon" />
            <span className="dropzone-title">Drop contract file here, or click to browse</span>
            <span className="dropzone-hint">PDF, PNG, or JPG — typed or scanned</span>
          </label>

          {status && (
            <div className={"scan-status" + (status.error ? " scan-status-error" : "")}>
              <span className="scan-spinner" aria-hidden="true"></span>
              <span>{status.text}</span>
            </div>
          )}

          {result && (
            <div className="scan-results">
              <div className="review-banner">
                <div>
                  {result.summary.length > 0 && (
                    <strong>
                      {result.summary.length} {result.summary.length === 1 ? "field" : "fields"}
                    </strong>
                  )}
                  {result.summary.length > 0 && result.costCodeCount > 0 && " and "}
                  {result.costCodeCount > 0 && (
                    <strong>
                      {result.costCodeCount} cost {result.costCodeCount === 1 ? "code" : "codes"}
                    </strong>
                  )}{" "}
                  imported from <span className="mono-field">{result.filename}</span> — review the highlighted
                  fields{result.costCodeCount > 0 ? " and cost codes" : ""} on the form, then confirm.
                </div>
                <div className="review-banner-actions">
                  <button type="button" className="btn btn-ghost" onClick={handleDiscard}>
                    Discard
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleConfirm}>
                    Confirm all
                  </button>
                </div>
              </div>
              <ul className="extracted-list">
                {result.summary.map((item, i) => (
                  <li key={i}>
                    <span className="extracted-label">{item.label}</span>
                    <span className="extracted-value mono-field">{item.raw}</span>
                  </li>
                ))}
              </ul>
              <details className="extracted-text-toggle">
                <summary>Show extracted text (for cross-check)</summary>
                <pre>{result.extractedText}</pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
