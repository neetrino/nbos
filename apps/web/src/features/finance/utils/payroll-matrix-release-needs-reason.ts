/** True when release amount exceeds planned remaining or order funding (EXTRA / OVER_FUNDING). */
export function payrollMatrixReleaseNeedsReason(
  amount: number,
  remaining: number,
  availableFunding: number,
): boolean {
  return amount > remaining || amount > availableFunding;
}
