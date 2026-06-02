import { assertFreshCredentialStepUp } from './credential-vault-access';
import type { CredentialsRuntime } from './credentials-runtime';

export async function assertPermanentDeleteStepUp(
  runtime: CredentialsRuntime,
  employeeId: string,
  stepUpPassword: string | undefined,
): Promise<void> {
  await assertFreshCredentialStepUp(runtime, employeeId, stepUpPassword, 'permanent_delete');
}
