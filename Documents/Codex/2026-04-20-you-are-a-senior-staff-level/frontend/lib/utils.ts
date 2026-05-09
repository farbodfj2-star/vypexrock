function resolvePriceDigits(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1000) return 2;
  if (absolute >= 1) return 4;
  if (absolute >= 0.1) return 5;
  if (absolute >= 0.01) return 6;
  return 8;
}

export function formatCurrency(value: number, digits?: number) {
  const fractionDigits = digits ?? resolvePriceDigits(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Math.min(fractionDigits, 2),
    maximumFractionDigits: fractionDigits
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
