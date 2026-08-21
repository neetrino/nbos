import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { assertEntityIsActive } from '../../../common/lifecycle/entity-lifecycle-guards';
import { normalizeAtsCallerPhone } from '../../integrations/ats/ats-phone.util';
import { CLICK_TO_CALL_MISSING_PHONE_MESSAGE } from './click-to-call.constants';
import type { ClickToCallTargetType } from './dto/start-click-to-call.dto';
import type { CallListParent } from './calls-access';

export type LoadedClickToCallTarget = {
  parent: CallListParent;
  targetType: ClickToCallTargetType;
  targetId: string;
  phoneE164: string;
  to: string;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  assignedEmployeeIds: string[];
};

@Injectable()
export class ClickToCallTargetLoader {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async load(
    targetType: ClickToCallTargetType,
    targetId: string,
  ): Promise<LoadedClickToCallTarget> {
    if (targetType === 'LEAD') return this.loadLead(targetId);
    if (targetType === 'CONTACT') return this.loadContact(targetId);
    return this.loadDeal(targetId);
  }

  private async loadLead(targetId: string): Promise<LoadedClickToCallTarget> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: targetId },
      select: { id: true, phone: true, contactId: true, assignedTo: true, trashedAt: true },
    });
    if (!lead) throw new NotFoundException(`Lead ${targetId} not found`);
    assertEntityIsActive(lead, 'trashedAt', 'Lead');
    const phone = requirePhone(lead.phone);
    return {
      parent: 'lead',
      targetType: 'LEAD',
      targetId,
      ...phone,
      leadId: lead.id,
      contactId: lead.contactId,
      dealId: null,
      assignedEmployeeIds: lead.assignedTo ? [lead.assignedTo] : [],
    };
  }

  private async loadContact(targetId: string): Promise<LoadedClickToCallTarget> {
    const contact = await this.prisma.contact.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        phone: true,
        trashedAt: true,
        extraPhones: { select: { e164: true }, orderBy: { createdAt: 'asc' }, take: 1 },
      },
    });
    if (!contact) throw new NotFoundException(`Contact ${targetId} not found`);
    assertEntityIsActive(contact, 'trashedAt', 'Contact');
    const phone = requirePhone(contact.phone ?? contact.extraPhones[0]?.e164 ?? null);
    return {
      parent: 'contact',
      targetType: 'CONTACT',
      targetId,
      ...phone,
      leadId: null,
      contactId: contact.id,
      dealId: null,
      assignedEmployeeIds: [],
    };
  }

  private async loadDeal(targetId: string): Promise<LoadedClickToCallTarget> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        leadId: true,
        contactId: true,
        sellerId: true,
        sellerAssistantId: true,
        trashedAt: true,
        contact: {
          select: {
            phone: true,
            extraPhones: { select: { e164: true }, orderBy: { createdAt: 'asc' }, take: 1 },
          },
        },
        lead: { select: { phone: true } },
      },
    });
    if (!deal) throw new NotFoundException(`Deal ${targetId} not found`);
    assertEntityIsActive(deal, 'trashedAt', 'Deal');
    const rawPhone =
      deal.contact?.phone ?? deal.contact?.extraPhones[0]?.e164 ?? deal.lead?.phone ?? null;
    const phone = requirePhone(rawPhone);
    return {
      parent: 'deal',
      targetType: 'DEAL',
      targetId,
      ...phone,
      leadId: deal.leadId,
      contactId: deal.contactId,
      dealId: deal.id,
      assignedEmployeeIds: [deal.sellerId, deal.sellerAssistantId].filter((id): id is string =>
        Boolean(id),
      ),
    };
  }
}

function requirePhone(raw: string | null | undefined): { phoneE164: string; to: string } {
  const phone = normalizeAtsCallerPhone(raw);
  if (!phone.success) {
    throw new BadRequestException(CLICK_TO_CALL_MISSING_PHONE_MESSAGE);
  }
  return { phoneE164: phone.e164, to: phone.digits };
}
