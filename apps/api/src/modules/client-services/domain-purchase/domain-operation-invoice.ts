import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { requirePositiveAmount } from '../client-service-flow-helpers';
import type { ClientServiceFlowsService } from '../client-service-flows.service';

const OPEN_INVOICE_STATUSES = ['NEW', 'AWAITING_PAYMENT', 'OVERDUE', 'ON_HOLD'] as const;

type PrismaDb = Pick<PrismaClient, 'invoice'>;

/** Reuses an open invoice for this service, otherwise creates one. */
export async function issueDomainInvoiceForService(
  prisma: PrismaDb,
  flows: ClientServiceFlowsService,
  serviceId: string,
  amount: number | null | undefined,
): Promise<string> {
  const confirmed = requirePositiveAmount(amount, 'Invoice amount');
  const existing = await prisma.invoice.findFirst({
    where: {
      clientServiceRecordId: serviceId,
      moneyStatus: { in: [...OPEN_INVOICE_STATUSES] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    const invoice = await flows.createInvoice(serviceId, { amount: confirmed, type: 'DOMAIN' });
    return invoice.id;
  } catch (caught) {
    if (caught instanceof BadRequestException) throw caught;
    throw new BadRequestException(
      caught instanceof Error ? caught.message : 'Invoice could not be created.',
    );
  }
}
