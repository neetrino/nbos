import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient, type TransactionClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  ATS_CALLDIRECT_INBOUND,
  ATS_LEAD_SOURCE,
  ATS_LEAD_SOURCE_DETAIL,
  ATS_TERMINAL_STATES,
} from './ats.constants';
import { normalizeAtsCallerPhone } from './ats-phone.util';
import { findOpenLeadByPhone } from '../../crm/leads/lead-duplicate-lookup.ops';
import { resolveContactPhoneInbound } from '../../crm/leads/lead-contact-inbound.ops';
import type { AtsWebhookPayload } from './ats.types';

interface AtsCallEventRow {
  id: string;
  uid: string;
  leadId: string | null;
}

@Injectable()
export class AtsLeadIngestService {
  private readonly logger = new Logger(AtsLeadIngestService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async ingestCallEvent(payload: AtsWebhookPayload): Promise<void> {
    const existing = await this.prisma.atsCallEvent.findUnique({
      where: { uid: payload.uid },
      select: { id: true, uid: true, leadId: true },
    });

    const event = await this.upsertCallEvent(payload, existing);

    // Outbound and unknown direction: persist event only (no Lead).
    if (payload.calldirect !== ATS_CALLDIRECT_INBOUND) {
      return;
    }

    if (event.leadId) {
      return;
    }

    const state = payload.state?.toLowerCase() ?? null;
    const isFirstSeen = existing == null;
    const shouldCreateLead =
      state === 'start' || (isFirstSeen && state != null && !ATS_TERMINAL_STATES.has(state));

    if (!shouldCreateLead) {
      return;
    }

    const leadId = await this.findOrCreateLeadForCaller(payload.clid);
    if (!leadId) {
      return;
    }

    await this.prisma.atsCallEvent.update({
      where: { id: event.id },
      data: { leadId },
    });
  }

  private async upsertCallEvent(
    payload: AtsWebhookPayload,
    existing: AtsCallEventRow | null,
  ): Promise<AtsCallEventRow> {
    const data = {
      state: payload.state,
      disposition: payload.disposition,
      billsec: payload.billsec,
      recordLink: payload.recordLink,
      clid: payload.clid,
      input: payload.input,
      calldirect: payload.calldirect,
      op: payload.op,
      channel: payload.channel,
      rate: payload.rate,
    };

    if (existing) {
      return this.prisma.atsCallEvent.update({
        where: { id: existing.id },
        data,
        select: { id: true, uid: true, leadId: true },
      });
    }

    return this.prisma.atsCallEvent.create({
      data: { uid: payload.uid, ...data },
      select: { id: true, uid: true, leadId: true },
    });
  }

  private async findOrCreateLeadForCaller(clid: string | null): Promise<string | null> {
    const phone = normalizeAtsCallerPhone(clid);
    if (!phone.success) {
      this.logger.warn({
        event: 'ats_inbound_phone_invalid',
        reason: phone.reason,
      });
      return null;
    }

    const openLead = await findOpenLeadByPhone(this.prisma, phone.e164);
    if (openLead) {
      return openLead.id;
    }

    const byContact = await resolveContactPhoneInbound(this.prisma, phone.e164);
    if (byContact.existingLeadId) {
      return byContact.existingLeadId;
    }
    if (byContact.hasOpenDeal) {
      return null;
    }

    return this.prisma.$transaction(async (tx) =>
      this.createInboundLead(tx, phone.e164, byContact.contactId),
    );
  }

  private async createInboundLead(
    tx: TransactionClient,
    e164: string,
    contactId: string | null,
  ): Promise<string> {
    // TODO: map MarketingAccount by DID (`input`) when call-tracking accounts exist.
    const contactName = `Incoming call ${e164}`;
    const lead = await tx.lead.create({
      data: {
        code: await this.generateLeadCode(tx),
        name: contactName,
        contactName,
        phone: e164,
        source: ATS_LEAD_SOURCE,
        sourceDetail: ATS_LEAD_SOURCE_DETAIL,
        ...(contactId ? { contactId } : {}),
      },
      select: { id: true },
    });
    return lead.id;
  }

  private async generateLeadCode(tx: TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const lastLead = await tx.lead.findFirst({
      where: { code: { startsWith: `L-${year}-` } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const nextNum = lastLead ? parseInt(lastLead.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `L-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
