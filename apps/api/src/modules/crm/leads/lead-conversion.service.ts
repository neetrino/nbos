import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaClient, DealTypeEnum, PaymentTypeEnum, LeadSourceEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { LeadsService } from './leads.service';
import { validateAttributionGate } from '../attribution-gate';
import { assertPartnerAssignableForInboundCrm } from '../../partners/partner-crm-source.ops';
import { mergeEntityContactIds } from '@nbos/shared';
import { syncEntityContactLinks } from '../shared/sync-entity-contact-links.ops';
import { assertEntityIsActive } from '../../../common/lifecycle/entity-lifecycle-guards';

interface ConvertLeadDto {
  dealType?: string;
  amount?: number;
  paymentType?: string;
  sellerId?: string;
}

interface LeadForConversion {
  id: string;
  name: string | null;
  contactName: string;
  status: string;
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
  phone: string | null;
  email: string | null;
  contactId: string | null;
  assignedTo?: string | null;
  deal?: { id: string } | null;
}

interface ConversionFieldError {
  field: string;
  message: string;
}

@Injectable()
export class LeadConversionService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly leadsService: LeadsService,
  ) {}

  async convertToDeal(leadId: string, data: ConvertLeadDto, opts?: { actorRoleLevel?: number }) {
    const lead = await this.leadsService.findById(leadId);
    assertEntityIsActive(lead, 'trashedAt', 'Lead');

    if (lead.status !== 'SQL') {
      throw new BadRequestException(
        `Lead must be in SQL status to convert. Current: ${lead.status}`,
      );
    }
    validateAttributionGate(lead, 'Lead', 'SQL');

    if (lead.deal) {
      throw new BadRequestException('Lead already has an associated deal');
    }

    return this.createDealFromLead(lead, data, false, opts?.actorRoleLevel);
  }

  async qualifyLeadAsSql(leadId: string, opts?: { actorRoleLevel?: number }) {
    const lead = await this.leadsService.findById(leadId);
    assertEntityIsActive(lead, 'trashedAt', 'Lead');

    validateAttributionGate(lead, 'Lead', 'SQL');

    if (lead.deal) {
      if (lead.status !== 'SQL') {
        await this.prisma.lead.update({
          where: { id: leadId },
          data: { status: 'SQL' },
        });
      }
      return lead.deal;
    }

    return this.createDealFromLead(
      lead,
      { sellerId: lead.assignedTo ?? undefined },
      true,
      opts?.actorRoleLevel,
    );
  }

  private async createDealFromLead(
    lead: LeadForConversion,
    data: ConvertLeadDto,
    markLeadAsSql: boolean,
    actorRoleLevel?: number,
  ) {
    const sellerId = data.sellerId ?? lead.assignedTo ?? undefined;
    const errors = getLeadConversionErrors(lead, sellerId);
    if (errors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'STAGE_GATE_VALIDATION',
        message: 'Lead cannot move to SQL: missing conversion fields',
        errors,
      });
    }
    const confirmedSellerId = sellerId as string;

    const year = new Date().getFullYear();
    const lastDeal = await this.prisma.deal.findFirst({
      where: { code: { startsWith: `D-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = lastDeal ? parseInt(lastDeal.code.split('-')[2] ?? '0', 10) + 1 : 1;
    const dealCode = `D-${year}-${String(nextNum).padStart(4, '0')}`;

    let contactId = lead.contactId;
    if (!contactId) {
      const nameParts = lead.contactName.split(' ');
      const contact = await this.prisma.contact.create({
        data: {
          firstName: nameParts[0] ?? lead.contactName,
          lastName: nameParts.slice(1).join(' ') || '-',
          phone: lead.phone,
          email: lead.email,
        },
      });
      contactId = contact.id;
    }

    const inquiryTitle = lead.name?.trim() ?? '';

    await assertPartnerAssignableForInboundCrm(
      this.prisma,
      lead.source ?? null,
      lead.sourcePartnerId,
      actorRoleLevel,
    );

    const deal = await this.prisma.deal.create({
      data: {
        code: dealCode,
        leadId: lead.id,
        contactId,
        name: inquiryTitle || undefined,
        ...(data.dealType && { type: data.dealType as DealTypeEnum }),
        amount: data.amount,
        ...(data.paymentType && { paymentType: data.paymentType as PaymentTypeEnum }),
        sellerId: confirmedSellerId,
        source: lead.source ? (lead.source as LeadSourceEnum) : undefined,
        sourceDetail: lead.sourceDetail,
        sourcePartnerId: lead.sourcePartnerId,
        sourceContactId: lead.sourceContactId,
        marketingAccountId: lead.marketingAccountId,
        marketingActivityId: lead.marketingActivityId,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        contactId,
        ...(markLeadAsSql && { status: 'SQL' }),
      },
    });

    const leadAdditional = await this.prisma.leadAdditionalContact.findMany({
      where: { leadId: lead.id },
      select: { contactId: true },
    });
    const additionalIds = leadAdditional.map((row) => row.contactId);
    if (additionalIds.length > 0) {
      await syncEntityContactLinks(
        this.prisma,
        'deal',
        deal.id,
        mergeEntityContactIds(contactId, additionalIds),
      );
    }

    return deal;
  }
}

function getLeadConversionErrors(
  lead: LeadForConversion,
  sellerId: string | undefined,
): ConversionFieldError[] {
  const errors: ConversionFieldError[] = [];

  if (!lead.name?.trim()) {
    errors.push({
      field: 'name',
      message: 'Inquiry title (product/service) is required before SQL / Deal creation',
    });
  }
  if (!lead.contactName.trim()) {
    errors.push({ field: 'contactName', message: 'Contact name is required' });
  }
  if (!lead.phone && !lead.email) {
    errors.push({ field: 'contactMethod', message: 'Phone or email is required' });
  }
  if (!sellerId) {
    errors.push({ field: 'assignedTo', message: 'Assigned Seller is required to create a Deal' });
  }

  return errors;
}
