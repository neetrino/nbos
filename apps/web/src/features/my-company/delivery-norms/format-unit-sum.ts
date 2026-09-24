export const UNIT_SUM_EMPTY = '—';

/** Drop the fixed scale zeros so a card shows 10, not 10.0000. */
export function formatUnitSum(total: string): string {
  const [whole = '', fraction = ''] = total.split('.');
  const trimmed = fraction.replace(/0+$/u, '');
  if (trimmed.length === 0) {
    return whole === '' ? '0' : whole;
  }
  return `${whole}.${trimmed}`;
}
