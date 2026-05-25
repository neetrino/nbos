import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { CreateDealDto } from './deal.types';

const QUICK_DEAL_NAME_MIN_LEN = 1;

export function assertQuickDealTitle(name: string | undefined): string {
  const trimmed = name?.trim() ?? '';
  if (trimmed.length < QUICK_DEAL_NAME_MIN_LEN) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'DEAL_NAME_REQUIRED',
      message: 'Deal title is required.',
      errors: [{ field: 'name', message: 'Provide a deal title.' }],
    });
  }
  return trimmed;
}

type LeadFactsForDealCreate = {
  id: string;
  name: string | null;
  contactId: string | null;
  assignedTo: string | null;
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
};

function mergeLeadFactsIntoDealCreate(
  data: CreateDealDto,
  lead: LeadFactsForDealCreate,
): CreateDealDto {
  return {
    ...data,
    leadId: data.leadId?.trim() || lead.id,
    name: data.name?.trim() || lead.name?.trim() || undefined,
    contactId: data.contactId?.trim() || lead.contactId?.trim() || undefined,
    sellerId: data.sellerId?.trim() || lead.assignedTo?.trim() || undefined,
    source: data.source !== undefined ? data.source : lead.source,
    sourceDetail: data.sourceDetail !== undefined ? data.sourceDetail : lead.sourceDetail,
    sourcePartnerId:
      data.sourcePartnerId !== undefined ? data.sourcePartnerId : lead.sourcePartnerId,
    sourceContactId:
      data.sourceContactId !== undefined ? data.sourceContactId : lead.sourceContactId,
    marketingAccountId:
      data.marketingAccountId !== undefined ? data.marketingAccountId : lead.marketingAccountId,
    marketingActivityId:
      data.marketingActivityId !== undefined ? data.marketingActivityId : lead.marketingActivityId,
  };
}

function pickOptionalTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/**
 * Prepares deal create payload: actor as seller; lead facts only when leadId is set.
 * Does not auto-fill business fields (type, paymentType, taxStatus, placeholder contact).
 */
export async function resolveDealCreateDefaults(
  prisma: InstanceType<typeof PrismaClient>,
  data: CreateDealDto,
  meta: { actorId?: string },
): Promise<CreateDealDto> {
  const leadId = data.leadId?.trim();
  let merged: CreateDealDto = { ...data };

  if (leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        name: true,
        contactId: true,
        assignedTo: true,
        source: true,
        sourceDetail: true,
        sourcePartnerId: true,
        sourceContactId: true,
        marketingAccountId: true,
        marketingActivityId: true,
      },
    });
    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }
    merged = mergeLeadFactsIntoDealCreate(merged, lead);
  } else {
    merged = { ...merged, name: assertQuickDealTitle(merged.name) };
  }

  const sellerId = pickOptionalTrimmed(merged.sellerId) || pickOptionalTrimmed(meta.actorId);
  if (!sellerId) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'SELLER_REQUIRED',
      message: 'Seller is required to create a deal.',
      errors: [
        { field: 'sellerId', message: 'Sign in with an employee profile or assign a seller.' },
      ],
    });
  }

  return {
    ...merged,
    name: pickOptionalTrimmed(merged.name),
    contactId: pickOptionalTrimmed(merged.contactId),
    sellerId,
    type: pickOptionalTrimmed(merged.type),
    paymentType: pickOptionalTrimmed(merged.paymentType),
    taxStatus: pickOptionalTrimmed(merged.taxStatus),
  };
}
