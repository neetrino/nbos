import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { CreateDealDto } from './deal.types';

const DIRECT_DEAL_NAME_MIN_LEN = 2;

export async function validateDealCreate(
  prisma: InstanceType<typeof PrismaClient>,
  data: CreateDealDto,
): Promise<void> {
  const contact = await prisma.contact.findUnique({
    where: { id: data.contactId },
    select: { id: true },
  });
  if (!contact) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'CONTACT_NOT_FOUND',
      message: `Contact ${data.contactId} was not found.`,
      errors: [{ field: 'contactId', message: 'Unknown contact id' }],
    });
  }

  await assertDealSellerRefs(prisma, {
    sellerId: data.sellerId,
    sellerAssistantId: data.sellerAssistantId ?? null,
  });

  const hasPriorLead = Boolean(data.leadId?.trim());
  if (!hasPriorLead) {
    assertDirectDealFields(data);
  }
}

export async function assertDealSellerRefs(
  prisma: InstanceType<typeof PrismaClient>,
  refs: { sellerId: string; sellerAssistantId: string | null | undefined },
): Promise<void> {
  const seller = await prisma.employee.findUnique({
    where: { id: refs.sellerId },
    select: { id: true },
  });
  if (!seller) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'SELLER_NOT_FOUND',
      message: `Employee ${refs.sellerId} was not found.`,
      errors: [{ field: 'sellerId', message: 'Unknown seller id' }],
    });
  }

  const assistantId = refs.sellerAssistantId?.trim();
  if (!assistantId) return;

  const assistant = await prisma.employee.findUnique({
    where: { id: assistantId },
    select: { id: true },
  });
  if (!assistant) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'SELLER_ASSISTANT_NOT_FOUND',
      message: `Employee ${assistantId} was not found.`,
      errors: [{ field: 'sellerAssistantId', message: 'Unknown sales assistant id' }],
    });
  }
}

function assertDirectDealFields(data: CreateDealDto): void {
  const name = data.name?.trim() ?? '';
  if (name.length < DIRECT_DEAL_NAME_MIN_LEN) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'DIRECT_DEAL_NAME_REQUIRED',
      message: 'Deal name is required when creating a deal without a prior lead.',
      errors: [
        {
          field: 'name',
          message: `Provide a name of at least ${DIRECT_DEAL_NAME_MIN_LEN} characters.`,
        },
      ],
    });
  }

  if (!data.source?.trim() || !data.sourceDetail?.trim()) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'DIRECT_DEAL_ATTRIBUTION_REQUIRED',
      message: 'Marketing attribution (From / Where) is required for deals created without a lead.',
      errors: [
        { field: 'source', message: 'From (source) is required' },
        { field: 'sourceDetail', message: 'Where (sourceDetail) is required' },
      ],
    });
  }
}
