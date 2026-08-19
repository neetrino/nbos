import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  ATS_CALLDIRECT_INBOUND,
  ATS_STATE_END,
  ATS_STATE_FINISH,
  ATS_STATE_START,
} from './ats.constants';
import { contactAnyPhoneOr } from '../../clients/contacts/contact-phone.ops';
import { atsPhoneLookupVariants, normalizeAtsCallerPhone } from './ats-phone.util';
import type { AtsWebhookPayload } from './ats.types';

/**
 * Resolves ATS Active Call `redirect_call` (SIP ID) for known callers.
 *
 * Match priority: Contact (by phone) → else Lead (by phone).
 * Contact has no owner field — responsible Employee is Deal.sellerId
 * (most recent non-trashed Deal), else Lead.assignedTo for that contact.
 * Lead uses Lead.assignedTo. Missing assignee / sipId → no redirect.
 */
@Injectable()
export class AtsCallRedirectService {
  private readonly logger = new Logger(AtsCallRedirectService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async resolveRedirectCall(payload: AtsWebhookPayload): Promise<string | null> {
    if (!this.shouldAttemptRedirect(payload)) {
      return null;
    }

    const phone = normalizeAtsCallerPhone(payload.clid);
    if (!phone.success) {
      return null;
    }

    const variants = atsPhoneLookupVariants(phone.e164, phone.digits);
    const contactSip = await this.sipForContactPhone(variants);
    if (contactSip !== undefined) {
      return contactSip;
    }

    return this.sipForLeadPhone(variants);
  }

  private shouldAttemptRedirect(payload: AtsWebhookPayload): boolean {
    if (payload.calldirect !== ATS_CALLDIRECT_INBOUND) {
      return false;
    }
    const state = payload.state?.toLowerCase() ?? null;
    if (state === ATS_STATE_FINISH || state === ATS_STATE_END) {
      return false;
    }
    return state === ATS_STATE_START;
  }

  /** `undefined` = no contact; `null` = contact found but no usable SIP. */
  private async sipForContactPhone(variants: string[]): Promise<string | null | undefined> {
    const contact = await this.prisma.contact.findFirst({
      where: { trashedAt: null, ...contactAnyPhoneOr(variants) },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    if (!contact) {
      return undefined;
    }

    const fromDeal = await this.sipFromContactDeal(contact.id);
    if (fromDeal) {
      return fromDeal;
    }

    const fromLead = await this.sipFromContactLead(contact.id);
    if (fromLead) {
      return fromLead;
    }

    this.logger.warn({
      event: 'ats_redirect_skipped',
      reason: 'CONTACT_NO_ASSIGNEE_SIP',
      contactId: contact.id,
    });
    return null;
  }

  private async sipFromContactDeal(contactId: string): Promise<string | null> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        trashedAt: null,
        OR: [{ contactId }, { additionalContacts: { some: { contactId } } }],
      },
      orderBy: { updatedAt: 'desc' },
      select: { seller: { select: { id: true, sipId: true } } },
    });
    return this.readSip(deal?.seller ?? null, 'CONTACT_DEAL_SELLER');
  }

  private async sipFromContactLead(contactId: string): Promise<string | null> {
    const lead = await this.prisma.lead.findFirst({
      where: { trashedAt: null, contactId, assignedTo: { not: null } },
      orderBy: { updatedAt: 'desc' },
      select: { assignee: { select: { id: true, sipId: true } } },
    });
    return this.readSip(lead?.assignee ?? null, 'CONTACT_LEAD_ASSIGNEE');
  }

  private async sipForLeadPhone(variants: string[]): Promise<string | null> {
    const lead = await this.prisma.lead.findFirst({
      where: { trashedAt: null, phone: { in: variants } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        assignedTo: true,
        assignee: { select: { id: true, sipId: true } },
      },
    });
    if (!lead) {
      return null;
    }
    if (!lead.assignedTo || !lead.assignee) {
      this.logger.warn({
        event: 'ats_redirect_skipped',
        reason: 'LEAD_NO_ASSIGNEE',
        leadId: lead.id,
      });
      return null;
    }
    return this.readSip(lead.assignee, 'LEAD_ASSIGNEE');
  }

  private readSip(
    employee: { id: string; sipId: string | null } | null,
    source: string,
  ): string | null {
    if (!employee) {
      return null;
    }
    const sipId = employee.sipId?.trim() ?? '';
    if (!sipId) {
      this.logger.warn({
        event: 'ats_redirect_skipped',
        reason: 'EMPLOYEE_NO_SIP',
        employeeId: employee.id,
        source,
      });
      return null;
    }
    return sipId;
  }
}
