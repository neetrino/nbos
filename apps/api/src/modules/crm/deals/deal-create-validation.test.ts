import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { validateDealCreate } from './deal-create-validation';

const baseDto = {
  contactId: 'c-1',
  type: 'PRODUCT',
  sellerId: 's-1',
  name: 'Acme site',
  source: 'SALES',
  sourceDetail: 'WEBSITE',
};

function prismaWithContact() {
  return {
    contact: {
      findUnique: vi.fn().mockResolvedValue({ id: 'c-1' }),
    },
  };
}

describe('validateDealCreate', () => {
  it('passes when contact exists and direct-deal fields are set', async () => {
    await expect(
      validateDealCreate(prismaWithContact() as never, baseDto),
    ).resolves.toBeUndefined();
  });

  it('passes without From/Where when leadId is present', async () => {
    await expect(
      validateDealCreate(prismaWithContact() as never, {
        ...baseDto,
        leadId: 'lead-1',
        source: undefined,
        sourceDetail: undefined,
      }),
    ).resolves.toBeUndefined();
  });

  it('throws CONTACT_NOT_FOUND when contact is missing', async () => {
    const prisma = { contact: { findUnique: vi.fn().mockResolvedValue(null) } };
    await expect(validateDealCreate(prisma as never, baseDto)).rejects.toThrow(BadRequestException);
  });

  it('throws when direct deal has no name', async () => {
    await expect(
      validateDealCreate(prismaWithContact() as never, {
        ...baseDto,
        name: 'A',
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const res = err instanceof BadRequestException ? err.getResponse() : {};
      return (
        typeof res === 'object' &&
        res !== null &&
        'code' in res &&
        res.code === 'DIRECT_DEAL_NAME_REQUIRED'
      );
    });
  });

  it('throws when direct deal has no attribution', async () => {
    await expect(
      validateDealCreate(prismaWithContact() as never, {
        ...baseDto,
        sourceDetail: '',
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const res = err instanceof BadRequestException ? err.getResponse() : {};
      return (
        typeof res === 'object' &&
        res !== null &&
        'code' in res &&
        res.code === 'DIRECT_DEAL_ATTRIBUTION_REQUIRED'
      );
    });
  });
});
