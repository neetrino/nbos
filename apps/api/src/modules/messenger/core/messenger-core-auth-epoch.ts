import { createHash } from 'node:crypto';
import { MESSENGER_AUTHORIZATION_EPOCH_LENGTH } from './messenger-core-revision.constants';
import type { MessengerZoneAccessFingerprintInput } from './messenger-core-revision.types';

export function messengerAuthorizationEpoch(input: MessengerZoneAccessFingerprintInput): string {
  const payload =
    input.zone === 'INTERNAL' ? internalEpochPayload(input) : clientEpochPayload(input);
  return createHash('sha256').update(payload).digest('hex').slice(0, MESSENGER_AUTHORIZATION_EPOCH_LENGTH);
}

export function zoneAccessFingerprint(
  access: {
    employeeId: string;
    viewScope: string;
    editScope: string;
    clientReadScope: string;
    clientSendScope: string;
    tasksViewScope?: string;
    departmentIds?: string[];
    taskAclDigest?: string;
    grantAclDigest?: string;
  },
  zone: MessengerZoneAccessFingerprintInput['zone'],
  tasksAccess?: { viewScope?: string; departmentIds?: string[] },
): MessengerZoneAccessFingerprintInput {
  return {
    employeeId: access.employeeId,
    viewScope: access.viewScope,
    editScope: access.editScope,
    clientReadScope: access.clientReadScope,
    clientSendScope: access.clientSendScope,
    tasksViewScope: tasksAccess?.viewScope ?? access.tasksViewScope,
    departmentIds: tasksAccess?.departmentIds ?? access.departmentIds,
    taskAclDigest: access.taskAclDigest,
    grantAclDigest: access.grantAclDigest,
    zone,
  };
}

export function authorizationEpochMatches(expected: string, received: string | undefined): boolean {
  return typeof received === 'string' && received === expected;
}

function clientEpochPayload(input: MessengerZoneAccessFingerprintInput): string {
  return JSON.stringify({
    e: input.employeeId,
    z: input.zone,
    v: input.viewScope,
    ed: input.editScope,
    cr: input.clientReadScope,
    cs: input.clientSendScope,
    ga: input.grantAclDigest ?? '',
  });
}

function internalEpochPayload(input: MessengerZoneAccessFingerprintInput): string {
  const departments = [...(input.departmentIds ?? [])].sort();
  return JSON.stringify({
    e: input.employeeId,
    z: input.zone,
    v: input.viewScope,
    ed: input.editScope,
    cr: input.clientReadScope,
    cs: input.clientSendScope,
    tv: input.tasksViewScope ?? '',
    td: departments,
    ta: input.taskAclDigest ?? '',
    ga: input.grantAclDigest ?? '',
  });
}
