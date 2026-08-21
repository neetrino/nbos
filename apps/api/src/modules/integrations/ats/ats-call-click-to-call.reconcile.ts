import type { PrismaClient } from '@nbos/database';
import {
  ATS_CALLDIRECT_OUTBOUND,
  ATS_CALL_SOURCE_CLICK_TO_CALL,
  ATS_CLICK_TO_CALL_RECONCILE_WINDOW_MS,
  ATS_STATE_INITIATED,
} from './ats.constants';
import { findEmployeeIdBySip } from './ats-call-employee.ops';
import { normalizeAtsCallerPhone } from './ats-phone.util';
import type { AtsWebhookPayload } from './ats.types';

type CallLookupDb = Pick<PrismaClient, 'atsCallEvent' | 'employee' | 'lead' | 'deal'>;

export type ClickToCallReconcileRow = {
  id: string;
  uid: string;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  responsibleEmployeeId: string | null;
  answeredEmployeeId: string | null;
};

const RECONCILE_SELECT = {
  id: true,
  uid: true,
  leadId: true,
  contactId: true,
  dealId: true,
  responsibleEmployeeId: true,
  answeredEmployeeId: true,
} as const;

/**
 * Match an ATS active-call webhook to a pending click-to-call row
 * when the callback has not yet received an ATS uid.
 */
export async function findPendingClickToCallEvent(
  db: CallLookupDb,
  payload: AtsWebhookPayload,
): Promise<ClickToCallReconcileRow | null> {
  if (payload.calldirect !== ATS_CALLDIRECT_OUTBOUND) return null;
  const phone = normalizeAtsCallerPhone(payload.clid);
  if (!phone.success) return null;

  const windowStart = new Date(Date.now() - ATS_CLICK_TO_CALL_RECONCILE_WINDOW_MS);
  const baseWhere = {
    source: ATS_CALL_SOURCE_CLICK_TO_CALL,
    state: ATS_STATE_INITIATED,
    phone: phone.e164,
    calldirect: ATS_CALLDIRECT_OUTBOUND,
    createdAt: { gte: windowStart },
  };
  const initiatedByEmployeeId = await findEmployeeIdBySip(db, payload.op);
  if (initiatedByEmployeeId) {
    const byInitiator = await db.atsCallEvent.findFirst({
      where: { ...baseWhere, initiatedByEmployeeId },
      orderBy: { createdAt: 'desc' },
      select: RECONCILE_SELECT,
    });
    if (byInitiator) return byInitiator;
  }
  return db.atsCallEvent.findFirst({
    where: baseWhere,
    orderBy: { createdAt: 'desc' },
    select: RECONCILE_SELECT,
  });
}
