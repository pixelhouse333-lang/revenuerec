// Extracts a cost code / schedule-of-values breakdown from contract text,
// e.g.:
//   01-3000   General Conditions & Project Management   $1,200,000.00
// Best-effort: PDF/OCR text extraction frequently loses the original
// table's column alignment, wrapping a single row's code, description,
// and amount across several lines with no reliable single-line pattern
// to match. Instead of requiring one line per row, this scans for cost
// code TOKENS anywhere in a scoped section, then takes the first dollar
// amount that appears after each one (and before the next code) as its
// budget, and everything in between (cleaned up) as its description.
// Every result is surfaced for human review before it's trusted.

// A code with an explicit separator (the standard CSI MasterFormat style,
// "01-3000") is safe to match anywhere - it doesn't collide with plain
// prose numbers or the tail end of a dollar amount, since the separator
// must sit directly against both digit groups with no space.
const SEPARATED_CODE_RE = /(?<![\d,.$])\b(\d{2,6}[-.]\d{1,4})\b/g;
// A bare digit code with no separator (e.g. "01000") is only trustworthy
// at the very start of a line, followed by a clear column gap (2+ spaces)
// before the description - otherwise it's indistinguishable from any
// other 2-6 digit number floating in the text (a division reference, a
// percentage, a page number...).
const PLAIN_CODE_RE = /^[ \t]*(\d{2,6})[ \t]{2,}(?=\S)/gm;
const MONEY_TOKEN_RE = /\$\s?[\d,]+(?:\.\d{2})?/g;

const SECTION_HEADERS = [
  /schedule\s+of\s+values/i,
  /cost\s+(?:code\s+)?breakdown/i,
  /budget(?:ed)?\s+cost\s+codes?/i,
  /budget\s+breakdown/i,
  /cost\s+codes?\s*(?:&|and)?\s*(?:direct\s+expense\s+breakdown)?/i,
  /application\s+for\s+payment/i,
];

const SECTION_END_MARKERS = [/total\s+estimated\s+budgeted\s+cost/i, /article\s+\d/i, /^\s*\d+\.\d+\s/im];

export function parseCostCodes(text) {
  let scopeStart = 0;
  for (const re of SECTION_HEADERS) {
    const m = re.exec(text);
    if (m) {
      scopeStart = m.index + m[0].length;
      break;
    }
  }

  let scopeEnd = text.length;
  for (const re of SECTION_END_MARKERS) {
    const m = re.exec(text.slice(scopeStart + 50)); // skip past the header's own line
    if (m) scopeEnd = Math.min(scopeEnd, scopeStart + 50 + m.index);
  }

  const scoped = extractByProximity(text.slice(scopeStart, scopeEnd));
  if (scoped.length >= 2) return scoped;

  // No clear section, or too few matches within it - fall back to the
  // whole document (still requires >= 2 matches to avoid one stray hit).
  return extractByProximity(text);
}

function extractByProximity(scopedText) {
  const codeMatches = [
    ...scopedText.matchAll(SEPARATED_CODE_RE),
    ...scopedText.matchAll(PLAIN_CODE_RE),
  ].sort((a, b) => a.index - b.index);
  if (codeMatches.length < 2) return [];

  const moneyMatches = [...scopedText.matchAll(MONEY_TOKEN_RE)];
  const results = [];

  for (let i = 0; i < codeMatches.length; i++) {
    const codeMatch = codeMatches[i];
    const codeEnd = codeMatch.index + codeMatch[0].length;

    // Guard against matching a fragment of a longer date like "10-01-2026"
    // (the code pattern is greedy enough to swallow "10-01" from it).
    if (/^[-.]\d/.test(scopedText.slice(codeEnd, codeEnd + 2))) continue;

    const nextCodeStart = i + 1 < codeMatches.length ? codeMatches[i + 1].index : scopedText.length;
    const amountMatch = moneyMatches.find((m) => m.index >= codeEnd && m.index < nextCodeStart);
    if (!amountMatch) continue;

    let description = scopedText
      .slice(codeEnd, amountMatch.index)
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[-:.]+\s*/, "");

    // The span often also picks up a second table column (e.g. the CSI
    // MasterFormat division) - keep just the text before it when present.
    description = description.split(/\s+(?:CSI\s+)?division\s+\d+/i)[0].trim();

    if (!description || description.length > 120) continue;

    results.push({
      code: codeMatch[1],
      description,
      budgetAmount: parseFloat(amountMatch[0].replace(/[$,\s]/g, "")),
    });
  }

  return results.length >= 2 ? results : [];
}
