import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { allocateLeadCode } from '../../../common/utils/entity-code-series';
import { ATS_CALLDIRECT_OUTBOUND, ATS_STATE_START, ATS_TERMINAL_STATES } from './ats.constants';
import { findPendingClickToCallEvent } from './ats-call-click-to-call.reconcile';
import { resolveAtsClientPhone, type AtsClientPhoneResolution } from './ats-call-client-phone';
import { AtsCallContextResolver, type AtsCallContext } from './ats-call-context.resolver';
import { findEmployeeIdBySip, findResponsibleEmployeeId } from './ats-call-employee.ops';
import { createAtsLead } from './ats-call-lead.ops';
import { maskAtsLogValue } from './ats-call-log.util';
import {
  CALL_ROW_SELECT,
  persistAtsCallByUid,
  type AtsPersistedCallRow,
} from './ats-call-uid-persist';
import { presentWebhookString } from './ats-webhook-field';
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
    const clientPhone = resolveAtsClientPhone(payload);
    this.logOutgoingReceived(payload, clientPhone);
    const context = await this.contextResolver.resolve(clientPhone.raw);
    if (isOutboundPayload(payload)) {
      this.logOutgoingPhone(payload, clientPhone, context);
    }
    if (context.skip) {
      this.logInvalidPhone(payload, clientPhone);
      await this.patchCall(event.id, await this.employeePatch(payload, event, context));
      return;
    }

    const employees = await this.employeePatch(payload, event, context);
    const callerId = employees.initiatedByEmployeeId ?? employees.responsibleEmployeeId ?? null;
    const leadId = await this.resolveLeadId(payload, event, context, isFirstSeen, callerId);
    const contactId = event.contactId ?? context.contactId;
    const dealId = event.dealId ?? context.dealId;
    await this.patchCall(event.id, { leadId, contactId, dealId, ...employees });
    this.logOutgoingCrm(payload, { leadId, contactId, dealId, callerId });
  }

  private async resolveLeadId(
    payload: AtsWebhookPayload,
    event: AtsCallRow,
    context: AtsCallContext,
    isFirstSeen: boolean,
    callerId: string | null,
  ): Promise<string | null> {
    if (event.leadId) return event.leadId;
    if (context.leadId) return context.leadId;
    const e164 = context.phone;
    if (!context.shouldCreateLead || !e164) return null;
    if (!this.shouldCreateLeadForState(payload, isFirstSeen)) return null;
    const code = await allocateLeadCode(this.prisma);
    return this.prisma.$transaction(async (tx) =>
      createAtsLead(tx, {
        e164,
        contactId: context.contactId,
        code,
        assignedTo: callerId,
        outbound: isOutboundPayload(payload),
      }),
    );
  }

  private shouldCreateLeadForState(payload: AtsWebhookPayload, isFirstSeen: boolean): boolean {
    const state = payload.state?.toLowerCase() ?? null;
    if (state === ATS_STATE_START) return true;
    return isFirstSeen && state != null && !ATS_TERMINAL_STATES.has(state);
  }

  private async employeePatch(
    payload: AtsWebhookPayload,
    event: AtsCallRow,
    context: AtsCallContext,
  ): Promise<{
    responsibleEmployeeId?: string | null;
    answeredEmployeeId?: string | null;
    initiatedByEmployeeId?: string | null;
  }> {
    const callerId = await this.resolveCallerEmployeeId(payload);
    if (isOutboundPayload(payload)) {
      this.logOutgoingEmployee(payload, callerId);
    }
    const answeredEmployeeId = event.answeredEmployeeId ?? callerId;
    if (event.responsibleEmployeeId) {
      return compactEmployeePatch(
        event.responsibleEmployeeId,
        answeredEmployeeId,
        event.initiatedByEmployeeId,
      );
    }
    if (isOutboundPayload(payload)) {
      const initiatedByEmployeeId = event.initiatedByEmployeeId ?? callerId;
      return compactEmployeePatch(callerId, answeredEmployeeId, initiatedByEmployeeId);
    }
    const responsibleEmployeeId = await findResponsibleEmployeeId(this.prisma, {
      leadId: event.leadId ?? context.leadId,
      dealId: event.dealId ?? context.dealId,
    });
    return compactEmployeePatch(
      responsibleEmployeeId,
      answeredEmployeeId,
      event.initiatedByEmployeeId,
    );
  }

  private async resolveCallerEmployeeId(payload: AtsWebhookPayload): Promise<string | null> {
    const fromOp = await findEmployeeIdBySip(this.prisma, presentWebhookString(payload.op) ?? null);
    if (fromOp) return fromOp;
    if (!isOutboundPayload(payload)) return null;
    return findEmployeeIdBySip(this.prisma, presentWebhookString(payload.clid) ?? null);
  }

  private async patchCall(
    id: string,
    data: {
      leadId?: string | null;
      contactId?: string | null;
      dealId?: string | null;
      responsibleEmployeeId?: string | null;
      answeredEmployeeId?: string | null;
      initiatedByEmployeeId?: string | null;
    },
  ): Promise<void> {
    if (Object.keys(data).length === 0) return;
    await this.prisma.atsCallEvent.update({ where: { id }, data });
  }

  private logOutgoingReceived(
    payload: AtsWebhookPayload,
    clientPhone: AtsClientPhoneResolution,
  ): void {
    if (!isOutboundPayload(payload)) return;
    this.logger.log({
      event: 'ats_outgoing_received',
      uid: payload.uid,
      lid: payload.lid ?? null,
      state: payload.state ?? null,
      calldirect: payload.calldirect,
      phoneSource: clientPhone.source,
    });
  }

  private logOutgoingPhone(
    payload: AtsWebhookPayload,
    clientPhone: AtsClientPhoneResolution,
    context: AtsCallContext,
  ): void {
    this.logger.log({
      event: 'ats_outgoing_client_phone_resolved',
      uid: payload.uid,
      lid: payload.lid ?? null,
      source: clientPhone.source,
      skip: context.skip,
      phone: maskAtsLogValue(context.phone ?? clientPhone.raw),
    });
  }

  private logOutgoingEmployee(payload: AtsWebhookPayload, employeeId: string | null): void {
    this.logger.log({
      event: 'ats_outgoing_employee_resolved',
      uid: payload.uid,
      lid: payload.lid ?? null,
      employeeId,
    });
  }

  private logOutgoingCrm(
    payload: AtsWebhookPayload,
    ids: {
      leadId: string | null;
      contactId: string | null;
      dealId: string | null;
      callerId: string | null;
    },
  ): void {
    if (!isOutboundPayload(payload)) return;
    this.logger.log({
      event: 'ats_outgoing_crm_resolved',
      uid: payload.uid,
      lid: payload.lid ?? null,
      state: payload.state ?? null,
      calldirect: payload.calldirect,
      employeeId: ids.callerId,
      leadId: ids.leadId,
      contactId: ids.contactId,
      dealId: ids.dealId,
    });
  }

  private logInvalidPhone(payload: AtsWebhookPayload, clientPhone: AtsClientPhoneResolution): void {
    if (!clientPhone.raw && !presentWebhookString(payload.clid)) return;
    const phone = normalizeAtsCallerPhone(clientPhone.raw ?? payload.clid);
    if (phone.success) return;
    this.logger.warn({
      event: 'ats_call_phone_invalid',
      uid: payload.uid,
      source: clientPhone.source,
      reason: phone.reason,
    });
  }
}

function isOutboundPayload(payload: AtsWebhookPayload): boolean {
  return payload.calldirect === ATS_CALLDIRECT_OUTBOUND;
}

function compactEmployeePatch(
  responsibleEmployeeId: string | null,
  answeredEmployeeId: string | null,
  initiatedByEmployeeId: string | null,
): {
  responsibleEmployeeId?: string | null;
  answeredEmployeeId?: string | null;
  initiatedByEmployeeId?: string | null;
} {
  const patch: {
    responsibleEmployeeId?: string | null;
    answeredEmployeeId?: string | null;
    initiatedByEmployeeId?: string | null;
  } = {};
  if (responsibleEmployeeId) patch.responsibleEmployeeId = responsibleEmployeeId;
  if (answeredEmployeeId) patch.answeredEmployeeId = answeredEmployeeId;
  if (initiatedByEmployeeId) patch.initiatedByEmployeeId = initiatedByEmployeeId;
  return patch;
}
