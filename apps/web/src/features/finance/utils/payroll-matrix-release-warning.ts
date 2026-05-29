export type MatrixReleaseWarningKind = 'EXTRA' | 'OVER_FUNDING';

/** Informational label for matrix cell edits — never blocks save. */
export function resolveMatrixReleaseWarningKind(
  amount: number,
  remaining: number,
  availableFunding: number,
): MatrixReleaseWarningKind | null {
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

export function matrixReleaseWarningLabel(kind: MatrixReleaseWarningKind | null): string | null {
  if (kind === 'EXTRA') {
    return 'Extra bonus';
  }
  if (kind === 'OVER_FUNDING') {
    return 'Over funding';
  }
  return null;
}

export function matrixReleaseWarningForAmount(
  amount: number,
  remaining: number,
  availableFunding: number,
): string | null {
  return matrixReleaseWarningLabel(
    resolveMatrixReleaseWarningKind(amount, remaining, availableFunding),
  );
}
