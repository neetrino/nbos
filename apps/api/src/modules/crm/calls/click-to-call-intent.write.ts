import type { PrismaClient } from '@nbos/database';
import { persistClickToCallEvent } from './click-to-call-store';
import { ATS_CALL_INTENT_STATUS } from './click-to-call-intent.constants';
import type { ClickToCallIntentRow } from './click-to-call-intent.store';
import type { LoadedClickToCallTarget } from './click-to-call-target';
import { CALL_LIST_SELECT } from './call-list.select';
import type { CallRecord } from './call-response.map';

type IntentWriteDb = Pick<PrismaClient, 'atsCallIntent' | 'atsCallEvent' | '$transaction'>;

export async function acceptClickToCallIntent(
  db: IntentWriteDb,
  input: {
    intent: ClickToCallIntentRow;
    target: LoadedClickToCallTarget;
    employeeId: string;
    errorCode?: never;
  },
): Promise<CallRecord> {
  return db.$transaction(async (tx) => {
    const call = await persistClickToCallEvent(tx, input.target, input.employeeId);
    await tx.atsCallIntent.update({
      where: { id: input.intent.id },
      data: {
        status: ATS_CALL_INTENT_STATUS.ACCEPTED,
        callId: call.id,
        completedAt: new Date(),
        errorCode: null,
      },
    });
    return call;
  });
}

export async function failClickToCallIntent(
  db: Pick<PrismaClient, 'atsCallIntent'>,
  intentId: string,
  errorCode: string,
): Promise<void> {
  await db.atsCallIntent.updateMany({
    where: { id: intentId, status: ATS_CALL_INTENT_STATUS.PROCESSING },
    data: {
      status: ATS_CALL_INTENT_STATUS.FAILED,
      errorCode,
      completedAt: new Date(),
    },
  });
}

export async function loadAcceptedCall(
  db: Pick<PrismaClient, 'atsCallEvent'>,
  callId: string,
): Promise<CallRecord | null> {
  return db.atsCallEvent.findUnique({
    where: { id: callId },
    select: CALL_LIST_SELECT,
  });
}
