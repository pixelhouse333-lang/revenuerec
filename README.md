# Constructa

An AI-native revenue recognition workspace for the construction industry — phase 1 covers contract
intake, a WIP (work-in-progress) cost ledger, and revenue recognition under the **percentage of
completion** and **completed contract** methods.

## Stack

React 18 + Vite. No backend — data is kept in the browser via `localStorage`, so it runs anywhere
with just Node installed.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## What's here

- **Contract Details** — contract identity, price, change orders, dates, payment terms, retainage,
  warranty, liquidated damages, notes. Includes a document-import flow (PDF or photo) that
  auto-fills accounting-relevant fields via OCR — every extracted field is flagged for human
  review and nothing is saved until it's confirmed or edited.
- **WIP Schedule** — the actual-cost ledger: vendor bills, payroll, materials, subcontractor, and
  equipment costs. This is the single source of truth for "costs incurred to date" — it's computed
  from the ledger, never hand-typed elsewhere.
- **Cost & Revenue Recognition** — pulls total contract value (from Contract Details) and costs
  incurred to date (from the WIP ledger), combines them with a manually entered, explicitly-flagged
  **estimated cost to complete** (a management judgment call, not a ledger fact), and computes
  percentage-of-completion / completed-contract revenue recognition, gross profit, billing status,
  and remaining backlog live in the sidebar.

## Project structure

```
src/
  components/     UI components (tabs, sidebar, topbar, import modal, form fields)
  context/        Contract state (React context + reducer) — single source of truth
  hooks/          useOcrImport — the document-import pipeline
  lib/            Pure logic: calculations, OCR text parsing, PDF/OCR reading, storage, formatting
```

OCR runs entirely client-side: `pdfjs-dist` reads text-based PDFs directly; `tesseract.js` handles
scanned PDFs and photos. No documents are uploaded anywhere.
