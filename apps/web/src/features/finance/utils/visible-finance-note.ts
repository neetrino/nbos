const MACHINE_NOTE_PREFIXES = [
  'nbos:v1:payrollCash:',
  'nbos:v1:payrollCashRefund:',
  'nbos:v1:sourceAmounts:',
] as const;

/** User-facing comment after a machine allocation prefix. Encoded lines stay out of the UI. */
export function visibleFinanceNote(notes: string | null | undefined): string | null {
  if (notes == null) return null;
  const lines = notes.split('\n');
  const first = lines[0] ?? '';
  const machine = MACHINE_NOTE_PREFIXES.some((prefix) => first.startsWith(prefix));
  const visible = (machine ? lines.slice(1) : lines).join('\n').trim();
  return visible.length > 0 ? visible : null;
}
