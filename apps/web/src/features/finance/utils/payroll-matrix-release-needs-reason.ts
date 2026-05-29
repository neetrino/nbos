export type MatrixReleaseExceptionKind = 'EXTRA' | 'OVER_FUNDING';

/** Classify matrix release amount vs planned remaining and order funding. */
export function resolveMatrixReleaseExceptionKind(
  amount: number,
  remaining: number,
  availableFunding: number,
): MatrixReleaseExceptionKind | null {
  if (amount <= 0) {
    return null;
  }
  if (amount > remaining) {
    return 'EXTRA';
  }
  if (availableFunding > 0 && amount > availableFunding) {
    return 'OVER_FUNDING';
  }
  return null;
}

/** True when release exceeds planned remaining or positive available order funding. */
export function payrollMatrixReleaseNeedsReason(
  amount: number,
  remaining: number,
  availableFunding: number,
): boolean {
  return resolveMatrixReleaseExceptionKind(amount, remaining, availableFunding) != null;
}

export function payrollMatrixReleaseReasonPlaceholder(
  amount: number,
  remaining: number,
  availableFunding: number,
): string {
  const kind = resolveMatrixReleaseExceptionKind(amount, remaining, availableFunding);
  if (kind === 'EXTRA') {
    return 'Extra bonus — reason required';
  }
  if (kind === 'OVER_FUNDING') {
    return 'Over funding — reason required';
  }
  return 'Reason required';
}
