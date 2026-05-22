import { BadRequestException } from '@nestjs/common';
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

function splitTitleForPlaceholderContact(title: string): { firstName: string; lastName: string } {
  const parts = title.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'New', lastName: 'Contact' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '—' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function createPlaceholderContact(
  prisma: InstanceType<typeof PrismaClient>,
  title: string,
): Promise<string> {
  const { firstName, lastName } = splitTitleForPlaceholderContact(title);
  const contact = await prisma.contact.create({
    data: { firstName, lastName },
  });
  return contact.id;
}

/**
 * Fills required deal FKs for quick-create (title-only UI); contact/seller/type defaults.
 */
export async function resolveDealCreateDefaults(
  prisma: InstanceType<typeof PrismaClient>,
  data: CreateDealDto,
  meta: { actorId?: string },
): Promise<CreateDealDto> {
  const hasPriorLead = Boolean(data.leadId?.trim());
  const name = hasPriorLead ? data.name?.trim() || undefined : assertQuickDealTitle(data.name);

  let contactId = data.contactId?.trim();
  if (!contactId) {
    contactId = await createPlaceholderContact(prisma, name ?? 'New deal');
  }

  const sellerId = data.sellerId?.trim() || meta.actorId?.trim();
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
    ...data,
    name,
    contactId,
    sellerId,
    type: data.type?.trim() || 'PRODUCT',
    paymentType: data.paymentType?.trim() || 'CLASSIC',
  };
}
