import type { PrismaClient } from '@nbos/database';
import { isPrismaUniqueViolation } from '../../../common/prisma-unique-violation';
import { ClickToCallIdempotencyConflictException } from './click-to-call-exceptions';
import {
  ATS_CALL_INTENT_STATUS,
  ATS_CALL_INTENT_UNIQUE_FIELDS,
  type AtsCallIntentStatus,
} from './click-to-call-intent.constants';

export type ClickToCallIntentRow = {
  id: string;
  employeeId: string;
  idempotencyKey: string;
  fingerprint: string;
  targetType: string;
  targetId: string;
  status: AtsCallIntentStatus;
  callId: string | null;
  atsUid: string | null;
  errorCode: string | null;
};

const INTENT_SELECT = {
  id: true,
  employeeId: true,
  idempotencyKey: true,
  fingerprint: true,
  targetType: true,
  targetId: true,
  status: true,
  callId: true,
  atsUid: true,
  errorCode: true,
} as const;

type IntentDb = Pick<PrismaClient, 'atsCallIntent'>;

export async function ensureClickToCallIntent(
  db: IntentDb,
  input: {
    employeeId: string;
    idempotencyKey: string;
    fingerprint: string;
    targetType: string;
    targetId: string;
  },
): Promise<ClickToCallIntentRow> {
  try {
    return (await db.atsCallIntent.create({
      data: {
        employeeId: input.employeeId,
        idempotencyKey: input.idempotencyKey,
        fingerprint: input.fingerprint,
        targetType: input.targetType,
        targetId: input.targetId,
        status: ATS_CALL_INTENT_STATUS.PENDING,
      },
      select: INTENT_SELECT,
    })) as ClickToCallIntentRow;
  } catch (error) {
    if (!isPrismaUniqueViolation(error, ATS_CALL_INTENT_UNIQUE_FIELDS)) {
      throw error;
    }
    return loadExistingIntent(db, input);
  }
}

export async function claimClickToCallIntent(db: IntentDb, id: string): Promise<boolean> {
  const result = await db.atsCallIntent.updateMany({
    where: { id, status: ATS_CALL_INTENT_STATUS.PENDING },
    data: { status: ATS_CALL_INTENT_STATUS.PROCESSING, claimedAt: new Date() },
  });
  return result.count > 0;
}

export async function loadClickToCallIntent(
  db: IntentDb,
  input: { employeeId: string; idempotencyKey: string },
): Promise<ClickToCallIntentRow | null> {
  const row = await db.atsCallIntent.findUnique({
    where: {
      employeeId_idempotencyKey: {
        employeeId: input.employeeId,
        idempotencyKey: input.idempotencyKey,
      },
    },
    select: INTENT_SELECT,
  });
  return row as ClickToCallIntentRow | null;
}

async function loadExistingIntent(
  db: IntentDb,
  input: {
    employeeId: string;
    idempotencyKey: string;
    fingerprint: string;
  },
): Promise<ClickToCallIntentRow> {
  const existing = await loadClickToCallIntent(db, input);
  if (!existing) {
    throw new Error('Click-to-call intent disappeared after unique conflict');
  }
  if (existing.fingerprint !== input.fingerprint) {
    throw new ClickToCallIdempotencyConflictException();
  }
  return existing;
}
