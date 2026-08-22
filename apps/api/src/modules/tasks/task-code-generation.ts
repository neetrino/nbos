/**
 * Task codes look like `T-{year}-{NNNN}` (zero-padded decimal suffix).
 *
 * The numeric part is allocated by `allocateEntityCodeNumber`, not derived from
 * existing rows: deriving it required reading the current maximum and then
 * inserting, which races under concurrent creates. Note that the padding is a
 * minimum rather than a width — once a year passes 9999 the code simply grows,
 * which is why the suffix must never be compared as text.
 */
export function formatTaskCode(year: number, numericSuffix: number): string {
  return `T-${year}-${String(numericSuffix).padStart(4, '0')}`;
}
