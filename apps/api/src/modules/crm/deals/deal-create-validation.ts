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

  const hasPriorLead = Boolean(data.leadId?.trim());
  if (!hasPriorLead) {
    assertDirectDealFields(data);
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
