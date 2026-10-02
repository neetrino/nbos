const PAYROLL_CASH_NOTE_PREFIX = 'nbos:v1:payrollCash:';

const MACHINE_NOTE_PREFIXES = [
  PAYROLL_CASH_NOTE_PREFIX,
  'nbos:v1:payrollCashRefund:',
  'nbos:v1:sourceAmounts:',
] as const;

/** Original payroll cash line. Refund rows use a different prefix and stay remove-only. */
export function isOriginalPayrollCashPayment(notes: string | null | undefined): boolean {
  return (notes ?? '').startsWith(PAYROLL_CASH_NOTE_PREFIX);
}

/** User-facing comment after a machine allocation prefix. Encoded lines stay out of the UI. */
export function visibleFinanceNote(notes: string | null | undefined): string | null {
  if (notes == null) return null;
  const lines = notes.split('\n');
  const first = lines[0] ?? '';
  const machine = MACHINE_NOTE_PREFIXES.some((prefix) => first.startsWith(prefix));
  const visible = (machine ? lines.slice(1) : lines).join('\n').trim();
  return visible.length > 0 ? visible : null;
}
