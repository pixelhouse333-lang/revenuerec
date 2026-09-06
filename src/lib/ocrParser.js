function findFirst(text, keywordRegexes, valueRegex, windowSize) {
  for (const kwRe of keywordRegexes) {
    kwRe.lastIndex = 0;
    const m = kwRe.exec(text);
    if (m) {
      const start = m.index + m[0].length;
      const win = text.slice(start, start + windowSize);
      const vm = valueRegex.exec(win);
      if (vm) return vm;
    }
  }
  return null;
}

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function toISODate(raw) {
  let m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(raw.trim());
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;

  m = /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/.exec(raw);
  if (m) {
    const mm = MONTHS[m[1].toLowerCase()];
    if (mm) return `${m[3]}-${String(mm).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  return null;
}

const DATE_VALUE_RE = () =>
  /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})|(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i;
const MONEY_VALUE_RE = () => /\$\s?([\d,]{1,15}(?:\.\d{2})?)/;
const PERCENT_VALUE_RE = () => /(\d{1,2}(?:\.\d+)?)\s?%/;

/**
 * Extracts accounting-relevant fields from raw contract text. Returns:
 *  - results: { fieldId: value } to pre-fill the form (never auto-saved)
 *  - summary: [{ label, raw }] for the human-review list
 */
export function parseContractText(text) {
  const results = {};
  const summary = [];

  function push(fieldId, label, value, raw) {
    if (value === null || value === undefined || value === "") return;
    results[fieldId] = value;
    summary.push({ label, raw: raw.trim() });
  }

  let m = findFirst(
    text,
    [/contract\s+sum/gi, /contract\s+price/gi, /total\s+contract\s+(?:amount|value)/gi, /contract\s+amount/gi],
    MONEY_VALUE_RE(), 100
  );
  if (m) push("contractPrice", "Contract price", parseFloat(m[1].replace(/,/g, "")), m[0]);

  m = findFirst(text, [/approved\s+change\s+orders?/gi, /change\s+order\s+total/gi], MONEY_VALUE_RE(), 100);
  if (m) push("changeOrders", "Approved change orders", parseFloat(m[1].replace(/,/g, "")), m[0]);

  m = findFirst(
    text,
    [/date\s+of\s+commencement/gi, /commencement\s+date/gi, /notice\s+to\s+proceed/gi, /start\s+date/gi],
    DATE_VALUE_RE(), 80
  );
  if (m) {
    const iso = toISODate(m[0]);
    if (iso) push("startDate", "Contract start date", iso, m[0]);
  }

  m = findFirst(
    text,
    [/substantial\s+completion(?:\s+date)?/gi, /completion\s+date/gi, /final\s+completion/gi],
    DATE_VALUE_RE(), 80
  );
  if (m) {
    const iso = toISODate(m[0]);
    if (iso) push("endDate", "Contract end date", iso, m[0]);
  }

  m = findFirst(text, [/retainage/gi, /retention/gi], PERCENT_VALUE_RE(), 60);
  if (m) push("retainagePct", "Retainage withheld", parseFloat(m[1]), m[0]);

  const netMatch = /net\s?(30|45|60)/i.exec(text);
  if (netMatch) {
    push("paymentTerms", "Payment terms", "net" + netMatch[1], netMatch[0]);
  } else if (/milestone(?:-|\s)based\s+payment/i.test(text)) {
    push("paymentTerms", "Payment terms", "milestone", "milestone-based payment");
  }

  m = findFirst(text, [/warranty\s+period/gi, /warrant(?:y|ies)/gi], /(\d{1,2})\s?[- ]?\s*(year|month)s?/i, 60);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    push("warrantyMonths", "Warranty period", unit === "year" ? n * 12 : n, m[0]);
  }

  m = findFirst(
    text, [/liquidated\s+damages/gi],
    /\$\s?([\d,]{1,10}(?:\.\d{2})?)\s?(?:per|\/)\s?(?:calendar\s+)?day/i, 120
  );
  if (m) {
    push("ldRate", "Liquidated damages rate", parseFloat(m[1].replace(/,/g, "")), m[0]);
    results.hasLiquidatedDamages = true;
    summary.push({ label: "Liquidated damages clause", raw: "detected" });
  }

  m = findFirst(text, [/contract\s+no\.?/gi, /contract\s+number/gi, /agreement\s+no\.?/gi], /[:-]?\s*([A-Z0-9][A-Z0-9\-/]{2,24})/i, 40);
  if (m) push("contractNumber", "Contract number", m[1].trim(), m[0]);

  m = findFirst(text, [/project\s+name\s*:?/gi, /project\s*:/gi], /([^\n\r]{3,80})/, 90);
  if (m) push("projectName", "Project name", m[1].trim(), m[0]);

  m = findFirst(text, [/owner\s+name\s*:?/gi, /owner\s*:/gi], /([^\n\r]{3,80})/, 90);
  if (m) push("customerName", "Customer / owner", m[1].trim(), m[0]);

  if (/cost[-\s]plus/i.test(text)) push("contractType", "Contract type", "cost-plus", "cost-plus");
  else if (/time\s+(?:and|&)\s+material/i.test(text)) push("contractType", "Contract type", "t-and-m", "time & material");
  else if (/unit\s+price/i.test(text)) push("contractType", "Contract type", "unit-price", "unit price");

  return { results, summary };
}
