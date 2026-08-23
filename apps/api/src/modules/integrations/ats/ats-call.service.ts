import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { allocateLeadCode } from '../../../common/utils/entity-code-series';
import { ATS_CALLDIRECT_OUTBOUND, ATS_STATE_START, ATS_TERMINAL_STATES } from './ats.constants';
import { findPendingClickToCallEvent } from './ats-call-click-to-call.reconcile';
import { AtsCallContextResolver, type AtsCallContext } from './ats-call-context.resolver';
import { findEmployeeIdBySip, findResponsibleEmployeeId } from './ats-call-employee.ops';
import { createAtsLead } from './ats-call-lead.ops';
import {
  CALL_ROW_SELECT,
  persistAtsCallByUid,
  type AtsPersistedCallRow,
} from './ats-call-uid-persist';
import { isWebhookFieldPresent, presentWebhookString } from './ats-webhook-field';
import { normalizeAtsCallerPhone } from './ats-phone.util';
import type { AtsCallIngestMeta } from './ats-call-realtime.publisher';
import type { AtsWebhookPayload } from './ats.types';

type AtsCallRow = AtsPersistedCallRow;

@Injectable()
export class AtsCallService {
  private readonly logger = new Logger(AtsCallService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly contextResolver: AtsCallContextResolver,
  ) {}

  async ingestCallEvent(payload: AtsWebhookPayload): Promise<AtsCallIngestMeta> {
    const existing = await this.findExistingCall(payload);
    const persisted = await persistAtsCallByUid(this.prisma, payload, existing);
    await this.applyCrmContext(payload, persisted.row, persisted.created);
    return {
      callId: persisted.row.id,
      isFirstSeen: persisted.created,
      stateTransitionApplied: persisted.stateTransitionApplied,
    };
  }

  private async findExistingCall(payload: AtsWebhookPayload): Promise<AtsCallRow | null> {
    const byUid = await this.prisma.atsCallEvent.findUnique({
      where: { uid: payload.uid },
      select: CALL_ROW_SELECT,
    });
    if (byUid) return byUid;
    return findPendingClickToCallEvent(this.prisma, payload);
  }

  private async applyCrmContext(
    payload: AtsWebhookPayload,
    event: AtsCallRow,
    isFirstSeen: boolean,
  ): Promise<void> {
    const context = await this.contextResolver.resolve(payload.clid ?? null);
    if (context.skip) {
      this.logInvalidPhone(payload);
      await this.patchCall(event.id, await this.employeePatch(payload, event, context));
      return;
    }

    const leadId = await this.resolveLeadId(payload, event, context, isFirstSeen);
    const contactId = event.contactId ?? context.contactId;
    const dealId = event.dealId ?? context.dealId;
    const employees = await this.employeePatch(payload, { ...event, leadId, dealId }, context);
    await this.patchCall(event.id, { leadId, contactId, dealId, ...employees });
  }

  private async resolveLeadId(
    payload: AtsWebhookPayload,
    event: AtsCallRow,
    context: AtsCallContext,
    isFirstSeen: boolean,
  ): Promise<string | null> {
    if (event.leadId) return event.leadId;
    if (context.leadId) return context.leadId;
    const e164 = context.phone;
    if (!context.shouldCreateLead || !e164) return null;
    if (!this.shouldCreateLeadForState(payload, isFirstSeen)) return null;
    const code = await allocateLeadCode(this.prisma);
    return this.prisma.$transaction(async (tx) => createAtsLead(tx, e164, context.contactId, code));
  }

  private shouldCreateLeadForState(payload: AtsWebhookPayload, isFirstSeen: boolean): boolean {
    const state = payload.state?.toLowerCase() ?? null;
    if (state === ATS_STATE_START) return true;
    return isFirstSeen && state != null && !ATS_TERMINAL_STATES.has(state);
  }

  private async employeePatch(
    payload: AtsWebhookPayload,
    event: Pick<AtsCallRow, 'leadId' | 'dealId' | 'responsibleEmployeeId' | 'answeredEmployeeId'>,
    context: AtsCallContext,
  ): Promise<{
    responsibleEmployeeId?: string | null;
    answeredEmployeeId?: string | null;
  }> {
    const op = presentWebhookString(payload.op);
    const bySip = op ? await findEmployeeIdBySip(this.prisma, op) : null;
    const answeredEmployeeId = event.answeredEmployeeId ?? bySip;
    if (event.responsibleEmployeeId) {
      return compactEmployeePatch(event.responsibleEmployeeId, answeredEmployeeId);
    }
    if (payload.calldirect === ATS_CALLDIRECT_OUTBOUND) {
      return compactEmployeePatch(bySip, answeredEmployeeId);
    }
    const responsibleEmployeeId = await findResponsibleEmployeeId(this.prisma, {
      leadId: event.leadId ?? context.leadId,
      dealId: event.dealId ?? context.dealId,
    });
    return compactEmployeePatch(responsibleEmployeeId, answeredEmployeeId);
  }

  private async patchCall(
    id: string,
    data: {
      leadId?: string | null;
      contactId?: string | null;
      dealId?: string | null;
      responsibleEmployeeId?: string | null;
      answeredEmployeeId?: string | null;
    },
  ): Promise<void> {
    if (Object.keys(data).length === 0) return;
    await this.prisma.atsCallEvent.update({ where: { id }, data });
  }

  private logInvalidPhone(payload: AtsWebhookPayload): void {
    if (!isWebhookFieldPresent(payload.clid)) return;
    const phone = normalizeAtsCallerPhone(payload.clid);
    if (phone.success) return;
    this.logger.warn({
      event: 'ats_call_phone_invalid',
      uid: payload.uid,
      reason: phone.reason,
    });
  }
}

function compactEmployeePatch(
  responsibleEmployeeId: string | null,
  answeredEmployeeId: string | null,
): {
  responsibleEmployeeId?: string | null;
  answeredEmployeeId?: string | null;
} {
  const patch: {
    responsibleEmployeeId?: string | null;
    answeredEmployeeId?: string | null;
  } = {};
  if (responsibleEmployeeId) patch.responsibleEmployeeId = responsibleEmployeeId;
  if (answeredEmployeeId) patch.answeredEmployeeId = answeredEmployeeId;
  return patch;
}
