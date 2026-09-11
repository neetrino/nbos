import { ServiceUnavailableException } from '@nestjs/common';
import {
  MESSENGER_DELTA_DISABLED_CODE,
  MESSENGER_DELTA_RECOVERY_ENABLED_ENV,
} from './messenger-core-revision.constants';

const ENABLED = new Set(['true', '1', 'yes']);
const DISABLED = new Set(['false', '0', 'no', '']);

/**
 * Two-stage rollout: writers always instrument. Delta HTTP recovery stays
 * unavailable until every API/worker instance runs instrumented code and
 * ops sets MESSENGER_DELTA_RECOVERY_ENABLED=true, then rolls all instances.
 * Default is false. Do not enable in repository defaults or production env.
 */
export function parseMessengerDeltaRecoveryEnabled(raw: unknown): boolean {
  if (raw === undefined || raw === null) return false;
  if (typeof raw !== 'string') {
    throw new Error(`${MESSENGER_DELTA_RECOVERY_ENABLED_ENV} must be a boolean string`);
  }
  const normalized = raw.trim().toLowerCase();
  if (ENABLED.has(normalized)) return true;
  if (DISABLED.has(normalized)) return false;
  throw new Error(`${MESSENGER_DELTA_RECOVERY_ENABLED_ENV} must be true, false, 1, 0, yes, or no`);
}

export function isMessengerDeltaRecoveryEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseMessengerDeltaRecoveryEnabled(env[MESSENGER_DELTA_RECOVERY_ENABLED_ENV]);
}

export function assertMessengerDeltaRecoveryEnabled(): void {
  if (isMessengerDeltaRecoveryEnabled()) return;
  throw new ServiceUnavailableException({
    code: MESSENGER_DELTA_DISABLED_CODE,
    message: 'Messenger delta recovery is not enabled',
  });
}
