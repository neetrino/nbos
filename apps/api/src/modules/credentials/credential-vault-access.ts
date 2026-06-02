import { assertCredentialStepUpPassword } from './credential-step-up';
import { credentialNeedsVaultUnlock } from './credential-vault-criticality';
import type { CredentialsRuntime } from './credentials-runtime';

/** LOW/MEDIUM: login session only. HIGH/CRITICAL: daily vault unlock or password (unlock on success). */
export async function assertVaultAccessForSecretAction(
  runtime: CredentialsRuntime,
  employeeId: string,
  criticality: string,
  stepUpPassword: string | undefined,
  purpose: string,
): Promise<void> {
  if (!credentialNeedsVaultUnlock(criticality)) return;

  if (await runtime.vaultSession.isUnlocked(employeeId)) return;

  await assertCredentialStepUpPassword(
    runtime.prisma,
    runtime.auditService,
    employeeId,
    stepUpPassword,
    purpose,
  );
  await runtime.vaultSession.unlock(employeeId);
}

/** Historical secrets: same daily unlock as HIGH/CRITICAL live secrets. */
export async function assertVaultAccessForSecretVersion(
  runtime: CredentialsRuntime,
  employeeId: string,
  stepUpPassword: string | undefined,
): Promise<void> {
  if (await runtime.vaultSession.isUnlocked(employeeId)) return;

  await assertCredentialStepUpPassword(
    runtime.prisma,
    runtime.auditService,
    employeeId,
    stepUpPassword,
    'secret_version_reveal',
  );
  await runtime.vaultSession.unlock(employeeId);
}

/** Export, emergency, permanent delete — always verify password; vault session does not apply. */
export async function assertFreshCredentialStepUp(
  runtime: CredentialsRuntime,
  employeeId: string,
  stepUpPassword: string | undefined,
  purpose: string,
): Promise<void> {
  await assertCredentialStepUpPassword(
    runtime.prisma,
    runtime.auditService,
    employeeId,
    stepUpPassword,
    purpose,
  );
}
