import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { ATS_CALLDIRECT_OUTBOUND, ATS_STATE_START, ATS_TERMINAL_STATES } from './ats.constants';
import { findPendingClickToCallEvent } from './ats-call-click-to-call.reconcile';
import { AtsCallContextResolver, type AtsCallContext } from './ats-call-context.resolver';
import { findEmployeeIdBySip, findResponsibleEmployeeId } from './ats-call-employee.ops';
import { createAtsLead } from './ats-call-lead.ops';
import { normalizeAtsCallerPhone } from './ats-phone.util';
import type { AtsCallIngestMeta } from './ats-call-realtime.publisher';
import type { AtsWebhookPayload } from './ats.types';

const CALL_ROW_SELECT = {
  id: true,
  uid: true,
  leadId: true,
  contactId: true,
  dealId: true,
  responsibleEmployeeId: true,
  answeredEmployeeId: true,
} as const;

type AtsCallRow = {
  id: string;
  uid: string;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  responsibleEmployeeId: string | null;
  answeredEmployeeId: string | null;
};

@Injectable()
export class AtsCallService {
  private readonly logger = new Logger(AtsCallService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly contextResolver: AtsCallContextResolver,
  ) {}

  async ingestCallEvent(payload: AtsWebhookPayload): Promise<AtsCallIngestMeta> {
    const existing = await this.findExistingCall(payload);
    const event = await this.upsertCallEvent(payload, existing);
    await this.applyCrmContext(payload, event, existing == null);
    return { callId: event.id, isFirstSeen: existing == null };
  }

  private async findExistingCall(payload: AtsWebhookPayload): Promise<AtsCallRow | null> {
    const byUid = await this.prisma.atsCallEvent.findUnique({
      where: { uid: payload.uid },
      select: CALL_ROW_SELECT,
    });
    if (byUid) return byUid;
    return findPendingClickToCallEvent(this.prisma, payload);
  }

  private async upsertCallEvent(
    payload: AtsWebhookPayload,
    existing: AtsCallRow | null,
  ): Promise<AtsCallRow> {
    const phone = normalizeAtsCallerPhone(payload.clid);
    const data = {
      state: payload.state,
      disposition: payload.disposition,
      billsec: payload.billsec,
      recordLink: payload.recordLink,
      clid: payload.clid,
      phone: phone.success ? phone.e164 : null,
      input: payload.input,
      calldirect: payload.calldirect,
      op: payload.op,
      channel: payload.channel,
      rate: payload.rate,
    };
    if (existing) {
      return this.prisma.atsCallEvent.update({
        where: { id: existing.id },
        data: { ...data, uid: payload.uid },
        select: CALL_ROW_SELECT,
      });
    }
    return this.prisma.atsCallEvent.create({
      data: { uid: payload.uid, ...data },
      select: CALL_ROW_SELECT,
    });
  }

  private async applyCrmContext(
    payload: AtsWebhookPayload,
    event: AtsCallRow,
    isFirstSeen: boolean,
  ): Promise<void> {
    const context = await this.contextResolver.resolve(payload.clid);
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

    return this.prisma.$transaction(async (tx) => createAtsLead(tx, e164, context.contactId));
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
    responsibleEmployeeId: string | null;
    answeredEmployeeId: string | null;
  }> {
    const bySip = await findEmployeeIdBySip(this.prisma, payload.op);
    const answeredEmployeeId = event.answeredEmployeeId ?? bySip;
    if (event.responsibleEmployeeId) {
      return { responsibleEmployeeId: event.responsibleEmployeeId, answeredEmployeeId };
    }
    if (payload.calldirect === ATS_CALLDIRECT_OUTBOUND) {
      return { responsibleEmployeeId: bySip, answeredEmployeeId };
    }
    const responsibleEmployeeId = await findResponsibleEmployeeId(this.prisma, {
      leadId: event.leadId ?? context.leadId,
      dealId: event.dealId ?? context.dealId,
    });
    return { responsibleEmployeeId, answeredEmployeeId };
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
    await this.prisma.atsCallEvent.update({ where: { id }, data });
  }

  private logInvalidPhone(payload: AtsWebhookPayload): void {
    const phone = normalizeAtsCallerPhone(payload.clid);
    if (phone.success) return;
    this.logger.warn({
      event: 'ats_call_phone_invalid',
      uid: payload.uid,
      reason: phone.reason,
    });
  }
}
