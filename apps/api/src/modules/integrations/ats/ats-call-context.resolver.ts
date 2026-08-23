import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { findOpenLeadByPhone } from '../../crm/leads/lead-duplicate-lookup.ops';
import { resolveContactPhoneInbound } from '../../crm/leads/lead-contact-inbound.ops';
import { normalizeAtsCallerPhone } from './ats-phone.util';

export interface AtsCallContext {
  skip: boolean;
  phone: string | null;
  contactId: string | null;
  leadId: string | null;
  dealId: string | null;
  shouldCreateLead: boolean;
}

const SKIPPED_CONTEXT: AtsCallContext = {
  skip: true,
  phone: null,
  contactId: null,
  leadId: null,
  dealId: null,
  shouldCreateLead: false,
};

@Injectable()
export class AtsCallContextResolver {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async resolve(clid: string | null): Promise<AtsCallContext> {
    const phone = normalizeAtsCallerPhone(clid);
    if (!phone.success) {
      return SKIPPED_CONTEXT;
    }

    const [openLead, byContact] = await Promise.all([
      findOpenLeadByPhone(this.prisma, phone.e164),
      resolveContactPhoneInbound(this.prisma, phone.e164),
    ]);

    const leadId = openLead?.id ?? byContact.existingLeadId;
    const dealId = byContact.dealId ?? (await this.findOpenDealIdForLead(leadId));

    return {
      skip: false,
      phone: phone.e164,
      contactId: byContact.contactId,
      leadId,
      dealId,
      shouldCreateLead: !leadId && !byContact.hasOpenDeal,
    };
  }

  private async findOpenDealIdForLead(leadId: string | null): Promise<string | null> {
    if (!leadId) return null;
    const deal = await this.prisma.deal.findFirst({
      where: {
        trashedAt: null,
        leadId,
        status: { notIn: ['WON', 'FAILED'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    return deal?.id ?? null;
  }
}
