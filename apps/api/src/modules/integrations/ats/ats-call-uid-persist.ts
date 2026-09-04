import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { isPrismaUniqueViolation } from '../../../common/prisma-unique-violation';
import { knownAtsStates, predecessorStatesFor } from './ats-call-state';
import { buildAtsCallCreateData, buildSparseAtsCallPatch } from './ats-call-sparse-patch';
import type { AtsWebhookPayload } from './ats.types';

const UID_UNIQUE_FIELDS = ['uid'] as const;

const CALL_ROW_SELECT = {
  id: true,
  uid: true,
  leadId: true,
  contactId: true,
  dealId: true,
  responsibleEmployeeId: true,
  answeredEmployeeId: true,
  initiatedByEmployeeId: true,
} as const;

export type AtsPersistedCallRow = {
  id: string;
  uid: string;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  responsibleEmployeeId: string | null;
  answeredEmployeeId: string | null;
  initiatedByEmployeeId: string | null;
};

export type AtsCallPersistResult = {
  row: AtsPersistedCallRow;
  created: boolean;
  stateTransitionApplied: boolean;
};

type CallPersistDb = Pick<PrismaClient, 'atsCallEvent'>;

const persistLogger = new Logger('AtsCallUidPersist');

export async function persistAtsCallByUid(
  db: CallPersistDb,
  payload: AtsWebhookPayload,
  existing: AtsPersistedCallRow | null,
): Promise<AtsCallPersistResult> {
  if (existing) {
    return applyExistingCallPatch(db, payload, existing);
  }
  return createOrRecoverCall(db, payload);
}

async function createOrRecoverCall(
  db: CallPersistDb,
  payload: AtsWebhookPayload,
): Promise<AtsCallPersistResult> {
  try {
    const row = await db.atsCallEvent.create({
      data: buildAtsCallCreateData(payload),
      select: CALL_ROW_SELECT,
    });
    return { row, created: true, stateTransitionApplied: true };
  } catch (error) {
    if (!isPrismaUniqueViolation(error, UID_UNIQUE_FIELDS)) {
      throw error;
    }
    persistLogger.log({ event: 'ats_call_uid_conflict_recovered', uid: payload.uid });
    const recovered = await db.atsCallEvent.findUnique({
      where: { uid: payload.uid },
      select: CALL_ROW_SELECT,
    });
    if (!recovered) {
      throw error;
    }
    return applyExistingCallPatch(db, payload, recovered);
  }
}

async function applyExistingCallPatch(
  db: CallPersistDb,
  payload: AtsWebhookPayload,
  existing: AtsPersistedCallRow,
): Promise<AtsCallPersistResult> {
  const sparse = { ...buildSparseAtsCallPatch(payload), uid: payload.uid };
  const nextState = sparse.state;
  let stateTransitionApplied = false;
  try {
    if (nextState) {
      stateTransitionApplied = await applyMonotonicState(db, existing.id, sparse, nextState);
    }
    if (!stateTransitionApplied) {
      await applySparseFields(db, existing.id, sparse);
    }
  } catch (error) {
    if (!isPrismaUniqueViolation(error, UID_UNIQUE_FIELDS)) {
      throw error;
    }
    persistLogger.log({ event: 'ats_call_uid_conflict_recovered', uid: payload.uid });
    const byUid = await db.atsCallEvent.findUnique({
      where: { uid: payload.uid },
      select: CALL_ROW_SELECT,
    });
    if (byUid && byUid.id !== existing.id) {
      return applyExistingCallPatch(db, payload, byUid);
    }
    throw error;
  }
  const row = await db.atsCallEvent.findUnique({
    where: { id: existing.id },
    select: CALL_ROW_SELECT,
  });
  return { row: row ?? existing, created: false, stateTransitionApplied };
}

async function applyMonotonicState(
  db: CallPersistDb,
  id: string,
  sparse: ReturnType<typeof buildSparseAtsCallPatch> & { uid: string },
  nextState: string,
): Promise<boolean> {
  const result = await db.atsCallEvent.updateMany({
    where: monotonicStateWhere(id, nextState),
    data: { ...omitState(sparse), state: nextState },
  });
  return result.count > 0;
}

async function applySparseFields(
  db: CallPersistDb,
  id: string,
  sparse: ReturnType<typeof buildSparseAtsCallPatch> & { uid?: string },
): Promise<void> {
  const fields = omitState(sparse);
  if (Object.keys(fields).length === 0) return;
  await db.atsCallEvent.updateMany({ where: { id }, data: fields });
}

function omitState<T extends { state?: string }>(sparse: T): Omit<T, 'state'> {
  const fields = { ...sparse };
  delete fields.state;
  return fields;
}

function monotonicStateWhere(id: string, incomingState: string) {
  const predecessors = predecessorStatesFor(incomingState);
  return {
    id,
    OR: [
      { state: { in: predecessors } },
      { state: null },
      { NOT: { state: { in: [...knownAtsStates()] } } },
    ],
  };
}

export { CALL_ROW_SELECT };
