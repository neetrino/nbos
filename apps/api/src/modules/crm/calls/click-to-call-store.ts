import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@nbos/database';
import {
  ATS_CALLDIRECT_OUTBOUND,
  ATS_CALL_SOURCE_CLICK_TO_CALL,
  ATS_CLICK_TO_CALL_RECONCILE_WINDOW_MS,
  ATS_CLICK_TO_CALL_UID_PREFIX,
  ATS_STATE_INITIATED,
} from '../../integrations/ats/ats.constants';
import { CALL_LIST_SELECT } from './call-list.select';
import type { CallRecord } from './call-response.map';
import type { LoadedClickToCallTarget } from './click-to-call-target';

type CallStoreDb = Pick<PrismaClient, 'atsCallEvent'>;

export async function persistClickToCallEvent(
  db: CallStoreDb,
  target: LoadedClickToCallTarget,
  employeeId: string,
): Promise<CallRecord> {
  const existing = await findRecentOutboundForTarget(db, target, employeeId);
  if (existing) {
    return db.atsCallEvent.update({
      where: { id: existing.id },
      data: {
        source: ATS_CALL_SOURCE_CLICK_TO_CALL,
        initiatedByEmployeeId: employeeId,
        responsibleEmployeeId: existing.responsibleEmployeeId ?? employeeId,
        leadId: existing.leadId ?? target.leadId,
        contactId: existing.contactId ?? target.contactId,
        dealId: existing.dealId ?? target.dealId,
      },
      select: CALL_LIST_SELECT,
    });
  }
  return db.atsCallEvent.create({
    data: {
      uid: `${ATS_CLICK_TO_CALL_UID_PREFIX}${randomUUID()}`,
      state: ATS_STATE_INITIATED,
      calldirect: ATS_CALLDIRECT_OUTBOUND,
      source: ATS_CALL_SOURCE_CLICK_TO_CALL,
      phone: target.phoneE164,
      clid: target.phoneE164,
      leadId: target.leadId,
      contactId: target.contactId,
      dealId: target.dealId,
      initiatedByEmployeeId: employeeId,
      responsibleEmployeeId: employeeId,
    },
    select: CALL_LIST_SELECT,
  });
}

async function findRecentOutboundForTarget(
  db: CallStoreDb,
  target: LoadedClickToCallTarget,
  employeeId: string,
): Promise<{
  id: string;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  responsibleEmployeeId: string | null;
} | null> {
  const windowStart = new Date(Date.now() - ATS_CLICK_TO_CALL_RECONCILE_WINDOW_MS);
  return db.atsCallEvent.findFirst({
    where: {
      phone: target.phoneE164,
      calldirect: ATS_CALLDIRECT_OUTBOUND,
      initiatedByEmployeeId: null,
      createdAt: { gte: windowStart },
      NOT: { uid: { startsWith: ATS_CLICK_TO_CALL_UID_PREFIX } },
      OR: [{ responsibleEmployeeId: employeeId }, { responsibleEmployeeId: null }],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      leadId: true,
      contactId: true,
      dealId: true,
      responsibleEmployeeId: true,
    },
  });
}
