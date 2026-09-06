// Extracts a cost code / schedule-of-values breakdown from contract text,
// e.g.:
//   01000   General Conditions          $85,000.00
//   03300   Concrete                    $310,000.00
// Best-effort: PDF/OCR text extraction often loses original column
// alignment, so this is a heuristic line scan, not a real table parser.
// Every result is surfaced for human review before it's trusted.

const LINE_ITEM_RE = /^\s*(\d{2,6}(?:[-.]\d{1,4})?)\s+([A-Za-z][A-Za-z0-9 &/,.'()-]{2,70}?)\s+\$?\s?([\d,]{2,}(?:\.\d{2})?)\s*$/;

const SECTION_HEADERS = [
  /schedule\s+of\s+values/i,
  /cost\s+(?:code\s+)?breakdown/i,
  /budget\s+breakdown/i,
  /cost\s+codes?/i,
  /application\s+for\s+payment/i,
];

/**
 * Returns an array of { code, description, budgetAmount } candidates.
 * Requires at least 2 matching lines so a single stray numbered line
 * elsewhere in the document doesn't get treated as a cost breakdown.
 */
export function parseCostCodes(text) {
  const lines = text.split(/\r?\n/);

  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (SECTION_HEADERS.some((re) => re.test(lines[i]))) {
      startIndex = i + 1;
      break;
    }
  }

  const scoped = extractFromLines(lines.slice(startIndex));
  if (scoped.length >= 2) return scoped;

  // No clear section header, or too few matches within it - fall back to
  // scanning the whole document.
  return extractFromLines(lines);
}

function extractFromLines(lines) {
  const found = [];
  for (const line of lines) {
    const m = LINE_ITEM_RE.exec(line);
    if (!m) continue;
    found.push({
      code: m[1],
      description: m[2].trim(),
      budgetAmount: parseFloat(m[3].replace(/,/g, "")),
    });
  }
  return found.length >= 2 ? found : [];
}
