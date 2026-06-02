import { assertCredentialStepUpPassword } from './credential-step-up';
import type { CredentialsRuntime } from './credentials-runtime';

export const PERMANENT_DELETE_STEP_UP_CRITICALITIES = new Set(['HIGH', 'CRITICAL']);

export async function assertPermanentDeleteStepUp(
  runtime: CredentialsRuntime,
  criticality: string,
  employeeId: string,
  stepUpPassword: string | undefined,
): Promise<void> {
  if (!PERMANENT_DELETE_STEP_UP_CRITICALITIES.has(criticality)) return;
  await assertCredentialStepUpPassword(
    runtime.prisma,
    runtime.auditService,
    employeeId,
    stepUpPassword,
    'permanent_delete',
  );
}
