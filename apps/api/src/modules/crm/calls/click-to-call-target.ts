import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { assertEntityIsActive } from '../../../common/lifecycle/entity-lifecycle-guards';
import { normalizeAtsCallerPhone } from '../../integrations/ats/ats-phone.util';
import type { CallAccessActor } from './call-access.types';
import { assertCallCreatePermission } from './click-to-call-access';
import { ClickToCallAccessPolicyService } from './click-to-call-access-policy.service';
import {
  CALL_CREATE_PERMISSION,
  CLICK_TO_CALL_MISSING_PHONE_MESSAGE,
} from './click-to-call.constants';
import type { ClickToCallTargetType } from './dto/start-click-to-call.dto';
import type { CallListParent } from './calls-access';

const EXISTENCE_SELECT = { id: true, trashedAt: true } as const;
const EXTRA_PHONE_SELECT = {
  extraPhones: { select: { e164: true }, orderBy: { createdAt: 'asc' as const }, take: 1 },
} as const;

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
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly access: ClickToCallAccessPolicyService,
  ) {}

  async load(
    targetType: ClickToCallTargetType,
    targetId: string,
    actor: CallAccessActor,
  ): Promise<LoadedClickToCallTarget> {
    if (targetType === 'LEAD') return this.loadLead(targetId, actor);
    if (targetType === 'CONTACT') return this.loadContact(targetId, actor);
    return this.loadDeal(targetId, actor);
  }

  private async loadLead(
    targetId: string,
    actor: CallAccessActor,
  ): Promise<LoadedClickToCallTarget> {
    await this.assertActiveTarget('lead', targetId, 'Lead');
    assertCallCreatePermission(actor.permissions, 'lead');
    const lead = requireAuthorized(
      await this.prisma.lead.findFirst({
        where: { id: targetId, AND: [await this.access.resolveLeadWhere(actor)] },
        select: { id: true, phone: true, contactId: true, assignedTo: true },
      }),
    );
    return {
      parent: 'lead',
      targetType: 'LEAD',
      targetId,
      ...requirePhone(lead.phone),
      leadId: lead.id,
      contactId: lead.contactId,
      dealId: null,
      assignedEmployeeIds: lead.assignedTo ? [lead.assignedTo] : [],
    };
  }

  private async loadContact(
    targetId: string,
    actor: CallAccessActor,
  ): Promise<LoadedClickToCallTarget> {
    await this.assertActiveTarget('contact', targetId, 'Contact');
    assertCallCreatePermission(actor.permissions, 'contact');
    const contact = requireAuthorized(
      await this.prisma.contact.findFirst({
        where: { id: targetId, AND: [await this.access.resolveContactWhere(actor)] },
        select: { id: true, phone: true, ...EXTRA_PHONE_SELECT },
      }),
    );
    return {
      parent: 'contact',
      targetType: 'CONTACT',
      targetId,
      ...requirePhone(contact.phone ?? contact.extraPhones[0]?.e164 ?? null),
      leadId: null,
      contactId: contact.id,
      dealId: null,
      assignedEmployeeIds: [],
    };
  }

  private async loadDeal(
    targetId: string,
    actor: CallAccessActor,
  ): Promise<LoadedClickToCallTarget> {
    await this.assertActiveTarget('deal', targetId, 'Deal');
    assertCallCreatePermission(actor.permissions, 'deal');
    const deal = requireAuthorized(
      await this.prisma.deal.findFirst({
        where: { id: targetId, AND: [await this.access.resolveDealWhere(actor)] },
        select: {
          id: true,
          leadId: true,
          contactId: true,
          sellerId: true,
          sellerAssistantId: true,
          contact: { select: { phone: true, ...EXTRA_PHONE_SELECT } },
          lead: { select: { phone: true } },
        },
      }),
    );
    const rawPhone =
      deal.contact?.phone ?? deal.contact?.extraPhones[0]?.e164 ?? deal.lead?.phone ?? null;
    return {
      parent: 'deal',
      targetType: 'DEAL',
      targetId,
      ...requirePhone(rawPhone),
      leadId: deal.leadId,
      contactId: deal.contactId,
      dealId: deal.id,
      assignedEmployeeIds: [deal.sellerId, deal.sellerAssistantId].filter((id): id is string =>
        Boolean(id),
      ),
    };
  }

  private async assertActiveTarget(
    model: 'lead' | 'contact' | 'deal',
    targetId: string,
    label: 'Lead' | 'Contact' | 'Deal',
  ): Promise<void> {
    const existing = await this.findExistingTarget(model, targetId);
    if (!existing) throw new NotFoundException(`${label} ${targetId} not found`);
    assertEntityIsActive(existing, 'trashedAt', label);
  }

  private findExistingTarget(model: 'lead' | 'contact' | 'deal', targetId: string) {
    const query = { where: { id: targetId }, select: EXISTENCE_SELECT };
    if (model === 'lead') return this.prisma.lead.findUnique(query);
    if (model === 'contact') return this.prisma.contact.findUnique(query);
    return this.prisma.deal.findUnique(query);
  }
}

function requireAuthorized<T>(row: T | null): T {
  if (!row) throw new ForbiddenException(`No permission: ${CALL_CREATE_PERMISSION}`);
  return row;
}

function requirePhone(raw: string | null | undefined): { phoneE164: string; to: string } {
  const phone = normalizeAtsCallerPhone(raw);
  if (!phone.success) {
    throw new BadRequestException(CLICK_TO_CALL_MISSING_PHONE_MESSAGE);
  }
  return { phoneE164: phone.e164, to: phone.digits };
}
