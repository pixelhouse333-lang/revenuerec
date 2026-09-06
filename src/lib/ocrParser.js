function toGlobal(re) {
  return re.flags.includes("g") ? re : new RegExp(re.source, re.flags + "g");
}

/**
 * Scans every occurrence of every keyword pattern (not just the first),
 * and checks both after and before each occurrence for a value match -
 * real contract language often states the value before the label
 * ("...ten percent (10%) retainage...") as often as after it.
 */
function findValueNearKeywords(text, keywordPatterns, valueRegex, { before = 0, after = 260 } = {}) {
  for (const kw of keywordPatterns) {
    const re = toGlobal(kw);
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const afterWin = text.slice(m.index + m[0].length, m.index + m[0].length + after);
      const afterMatch = valueRegex.exec(afterWin);
      if (afterMatch) return afterMatch;

      if (before > 0) {
        const beforeStart = Math.max(0, m.index - before);
        const beforeWin = text.slice(beforeStart, m.index);
        const beforeMatches = [...beforeWin.matchAll(toGlobal(valueRegex))];
        if (beforeMatches.length > 0) return beforeMatches[beforeMatches.length - 1];
      }

      if (re.lastIndex === m.index) re.lastIndex += 1; // guard against zero-length matches
    }
  }
  return null;
}

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function toISODate(raw) {
  let m = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;

  m = /([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/.exec(raw);
  if (m) {
    const mm = MONTHS[m[1].toLowerCase()];
    if (mm) return `${m[3]}-${String(mm).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }

  m = /(\d{1,2})(?:st|nd|rd|th)?\s+day\s+of\s+([A-Za-z]+),?\s+(\d{4})/i.exec(raw);
  if (m) {
    const mm = MONTHS[m[2].toLowerCase()];
    if (mm) return `${m[3]}-${String(mm).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }

  return null;
}

const DATE_VALUE_RE = () =>
  /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})|(\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+[A-Za-z]+,?\s+\d{4})|(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i;
const MONEY_VALUE_RE = () => /\$\s?([\d,]{1,15}(?:\.\d{2})?)/;
const PERCENT_VALUE_RE = () => /(\d{1,2}(?:\.\d+)?)\s?%/;
// Tolerant of a wrapping "(1)" between the number and its unit word.
const DURATION_VALUE_RE = () => /\(?\s*(\d{1,2})\s*\)?\s*(?:calendar\s+|consecutive\s+)?(year|month|day)s?\b/i;

/**
 * Extracts accounting-relevant fields from raw contract text. Returns:
 *  - results: { fieldId: value } to pre-fill the form (never auto-saved)
 *  - summary: [{ label, raw }] for the human-review list
 *
 * Real contract language rarely matches a single rigid pattern, so every
 * field tries several keyword phrasings and searches both before and
 * after each one, plus (where the phrasing is common enough) a
 * standalone pattern that doesn't depend on a keyword at all.
 */
export function parseContractText(text) {
  const results = {};
  const summary = [];

  function push(fieldId, label, value, raw) {
    if (value === null || value === undefined || value === "") return;
    if (fieldId in results) return;
    results[fieldId] = value;
    summary.push({ label, raw: raw.trim().replace(/\s+/g, " ").replace(/^[:#\-\s]+/, "") });
  }

  // --- Contract price -----------------------------------------------
  // Prioritize the extremely common legal pattern: "...Dollars ($1,250,000.00)"
  let m = /Dollars\s*\(\s*\$\s*([\d,]{1,15}(?:\.\d{2})?)\s*\)/i.exec(text);
  if (m) push("contractPrice", "Contract price", parseFloat(m[1].replace(/,/g, "")), m[0]);
  if (!("contractPrice" in results)) {
    m = findValueNearKeywords(
      text,
      [/contract\s+sum/gi, /contract\s+price/gi, /total\s+contract\s+(?:amount|value)/gi, /contract\s+amount/gi, /lump[\s-]sum\s+(?:amount|price)/gi],
      MONEY_VALUE_RE(),
      { after: 300 }
    );
    if (m) push("contractPrice", "Contract price", parseFloat(m[1].replace(/,/g, "")), m[0]);
  }

  // --- Change orders --------------------------------------------------
  m = findValueNearKeywords(
    text,
    [/approved\s+change\s+orders?/gi, /change\s+order\s+total/gi, /change\s+orders?\s+(?:total|of|totaling)/gi],
    MONEY_VALUE_RE(),
    { after: 200 }
  );
  if (m) push("changeOrders", "Approved change orders", parseFloat(m[1].replace(/,/g, "")), m[0]);

  // --- Start date -------------------------------------------------------
  m = DATE_VALUE_RE_before(text, /commencement\s+date|effective\s+date|start\s+date/i);
  if (m) {
    const iso = toISODate(m[0]);
    if (iso) push("startDate", "Contract start date", iso, m[0]);
  }
  if (!("startDate" in results)) {
    m = findValueNearKeywords(
      text,
      [
        /date\s+of\s+commencement/gi,
        /commencement\s+date/gi,
        /notice\s+to\s+proceed/gi,
        /shall\s+commence/gi,
        /\bcommence(?:s|d)?\s+(?:work\s+)?on\b/gi,
        /effective\s+date/gi,
        /\beffective\s+(?:as\s+of\s+)?/gi,
        /\bis\s+effective\b/gi,
      ],
      DATE_VALUE_RE(),
      { after: 200 }
    );
    if (m) {
      const iso = toISODate(m[0]);
      if (iso) push("startDate", "Contract start date", iso, m[0]);
    }
  }

  // --- End date -----------------------------------------------------
  m = findValueNearKeywords(
    text,
    [
      /substantial\s+completion(?:\s+date)?/gi,
      /completion\s+date/gi,
      /final\s+completion/gi,
      /complete[sd]?\s+(?:the\s+work\s+)?(?:no\s+later\s+than|by|on\s+or\s+before)/gi,
      /achieve\s+substantial\s+completion/gi,
    ],
    DATE_VALUE_RE(),
    { after: 200 }
  );
  if (m) {
    const iso = toISODate(m[0]);
    if (iso) push("endDate", "Contract end date", iso, m[0]);
  }

  // --- Retainage ------------------------------------------------------
  m = findValueNearKeywords(text, [/retainage/gi, /retention/gi, /retain(?:s|ed)?\b/gi], PERCENT_VALUE_RE(), {
    after: 100,
    before: 100,
  });
  if (m) push("retainagePct", "Retainage withheld", parseFloat(m[1]), m[0]);

  // --- Payment terms --------------------------------------------------
  const netMatch = /net\s?(30|45|60)/i.exec(text);
  const withinDaysMatch = /within\s+(?:[a-z]+[\s-]*){0,2}\(?\s*(30|45|60)\s*\)?\s*days?/i.exec(text);
  if (netMatch) {
    push("paymentTerms", "Payment terms", "net" + netMatch[1], netMatch[0]);
  } else if (withinDaysMatch) {
    push("paymentTerms", "Payment terms", "net" + withinDaysMatch[1], withinDaysMatch[0]);
  } else if (/milestone(?:-|\s)based\s+payment/i.test(text)) {
    push("paymentTerms", "Payment terms", "milestone", "milestone-based payment");
  }

  // --- Warranty period --------------------------------------------------
  m = findValueNearKeywords(text, [/warranty\s+period/gi, /warrant(?:y|ies)/gi, /guarant(?:y|ee)\s+period/gi], DURATION_VALUE_RE(), {
    after: 120,
  });
  if (m && /year|month/i.test(m[0])) {
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    push("warrantyMonths", "Warranty period", unit === "year" ? n * 12 : n, m[0]);
  }

  // --- Liquidated damages rate -----------------------------------------
  m = findValueNearKeywords(
    text,
    [/liquidated\s+damages/gi],
    /\$\s?([\d,]{1,10}(?:\.\d{2})?)[\s\S]{0,45}?(?:per|for\s+each|per\s+each|daily(?:\s+rate)?|per\s+diem)[\s\S]{0,15}?day/i,
    { after: 260 }
  );
  if (m) {
    push("ldRate", "Liquidated damages rate", parseFloat(m[1].replace(/,/g, "")), m[0]);
    results.hasLiquidatedDamages = true;
    summary.push({ label: "Liquidated damages clause", raw: "detected" });
  }

  // --- Contract number --------------------------------------------------
  m = findValueNearKeywords(
    text,
    [/contract\s+no\.?/gi, /contract\s+number/gi, /contract\s*#/gi, /agreement\s+no\.?/gi, /project\s+no\.?/gi, /job\s+no\.?/gi],
    /[:#\-]?\s*([A-Z0-9][A-Z0-9\-/]{2,24})/i,
    { after: 40 }
  );
  if (m) push("contractNumber", "Contract number", m[1].trim(), m[0]);

  // --- Project name --------------------------------------------------
  m = findValueNearKeywords(text, [/project\s+name\s*:?/gi, /project\s*:/gi, /\bre\s*:/gi], /([^\n\r]{3,90})/, { after: 100 });
  if (m) push("projectName", "Project name", m[1].trim(), m[0]);

  // --- Customer / owner ------------------------------------------------
  // Common legal pattern: "<Name>, a <descriptor> (\"Owner\")" - the name
  // precedes the defined term, often with a descriptor clause after a
  // comma ("Meridian Health System, a nonprofit corporation (\"Owner\")") -
  // take only the text before the first comma as the entity name.
  m = /([^\n(]{2,120}?)\s*\(\s*(?:the\s+)?["“]?Owner["”]?\s*\)/i.exec(text);
  if (m) {
    const name = m[1].split(",")[0].trim().replace(/^(?:and|by and between)\s+/i, "");
    push("customerName", "Customer / owner", name, m[0]);
  }
  if (!("customerName" in results)) {
    m = findValueNearKeywords(text, [/owner\s+name\s*:?/gi, /owner\s*:/gi], /([^\n\r]{3,90})/, { after: 100 });
    if (m) push("customerName", "Customer / owner", m[1].trim(), m[0]);
  }

  // --- Contract type ---------------------------------------------------
  if (/cost[-\s]plus/i.test(text)) push("contractType", "Contract type", "cost-plus", "cost-plus");
  else if (/time\s+(?:and|&)\s+material/i.test(text)) push("contractType", "Contract type", "t-and-m", "time & material");
  else if (/unit\s+price/i.test(text)) push("contractType", "Contract type", "unit-price", "unit price");
  else if (/lump[\s-]sum|fixed[\s-]price/i.test(text)) push("contractType", "Contract type", "fixed", "lump-sum / fixed price");

  return { results, summary };
}

// Looks for a date immediately followed by a parenthetical defined term,
// e.g. "February 1, 2026 (the \"Commencement Date\")" - the date comes
// BEFORE its label in this construction, so a forward keyword search
// alone would miss it entirely.
function DATE_VALUE_RE_before(text, labelPattern) {
  const dateRe = toGlobal(DATE_VALUE_RE());
  let m;
  while ((m = dateRe.exec(text))) {
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 60);
    const parenMatch = /^\s*\(\s*(?:the\s+)?["“]?([^"”)]{2,40})["”]?\s*\)/.exec(after);
    if (parenMatch && labelPattern.test(parenMatch[1])) {
      return [m[0]];
    }
    if (dateRe.lastIndex === m.index) dateRe.lastIndex += 1;
  }
  return null;
}
