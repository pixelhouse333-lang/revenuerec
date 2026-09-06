const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function fmtCurrency(n) {
  return currencyFormatter.format(Math.round(n || 0));
}

export function fmtPercent(n) {
  return ((n || 0) * 100).toFixed(1) + "%";
}

export function num(value) {
  const v = parseFloat(value);
  return Number.isFinite(v) ? v : 0;
}
