/** True when API rejected copy/reveal because vault unlock or step-up password is required. */
export function isCredentialVaultStepUpRequired(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('step-up') ||
    message.includes('stepuppassword') ||
    message.includes('vault unlock') ||
    message.includes('high-risk action')
  );
}
