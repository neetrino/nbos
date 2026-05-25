/**
 * Task codes look like `T-{year}-{NNNN}` (zero-padded decimal suffix).
 * Lexicographic string sort does not match numeric order (e.g. `T-2026-9999` > `T-2026-10000`),
 * which can produce duplicate codes and DB unique violations.
 */
export function nextTaskCodeNumericSuffix(year: number, existingCodes: readonly string[]): number {
  const prefix = `T-${year}-`;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suffixRe = new RegExp(`^${escapedPrefix}(\\d+)$`);
  let max = 0;
  for (const code of existingCodes) {
    const m = code.match(suffixRe);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return max + 1;
}

export function formatTaskCode(year: number, numericSuffix: number): string {
  return `T-${year}-${String(numericSuffix).padStart(4, '0')}`;
}
