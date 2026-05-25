import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { CreateDealDto } from './deal.types';

export async function validateDealCreate(
  prisma: InstanceType<typeof PrismaClient>,
  data: CreateDealDto,
): Promise<void> {
  const contactId = data.contactId?.trim();
  if (contactId) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { id: true },
    });
    if (!contact) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'CONTACT_NOT_FOUND',
        message: `Contact ${contactId} was not found.`,
        errors: [{ field: 'contactId', message: 'Unknown contact id' }],
      });
    }
  }

  const sellerId = data.sellerId?.trim();
  if (!sellerId) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'SELLER_REQUIRED',
      message: 'Seller is required for deal creation.',
      errors: [{ field: 'sellerId', message: 'Seller id is missing' }],
    });
  }

  await assertDealSellerRefs(prisma, {
    sellerId,
    sellerAssistantId: data.sellerAssistantId ?? null,
  });
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
