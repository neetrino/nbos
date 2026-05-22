export function parseBonusPoolAmount(value: string | null | undefined): number {
  if (value == null) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
