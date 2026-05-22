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
    employee: {
      findUnique: vi
        .fn()
        .mockImplementation(({ where }: { where: { id: string } }) =>
          Promise.resolve({ id: where.id }),
        ),
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
    const prisma = {
      contact: { findUnique: vi.fn().mockResolvedValue(null) },
      employee: { findUnique: vi.fn() },
    };
    await expect(validateDealCreate(prisma as never, baseDto)).rejects.toThrow(BadRequestException);
  });

  it('throws SELLER_NOT_FOUND when seller employee is missing', async () => {
    const prisma = {
      contact: { findUnique: vi.fn().mockResolvedValue({ id: 'c-1' }) },
      employee: {
        findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
          if (where.id === 's-1') return Promise.resolve(null);
          return Promise.resolve({ id: where.id });
        }),
      },
    };
    await expect(validateDealCreate(prisma as never, baseDto)).rejects.toSatisfy((err: unknown) => {
      const res = err instanceof BadRequestException ? err.getResponse() : {};
      return (
        typeof res === 'object' && res !== null && 'code' in res && res.code === 'SELLER_NOT_FOUND'
      );
    });
  });

  it('throws SELLER_ASSISTANT_NOT_FOUND when assistant id is unknown', async () => {
    const prisma = {
      contact: { findUnique: vi.fn().mockResolvedValue({ id: 'c-1' }) },
      employee: {
        findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
          if (where.id === 's-1') return Promise.resolve({ id: 's-1' });
          return Promise.resolve(null);
        }),
      },
    };
    await expect(
      validateDealCreate(prisma as never, { ...baseDto, sellerAssistantId: 'unknown-asst' }),
    ).rejects.toSatisfy((err: unknown) => {
      const res = err instanceof BadRequestException ? err.getResponse() : {};
      return (
        typeof res === 'object' &&
        res !== null &&
        'code' in res &&
        res.code === 'SELLER_ASSISTANT_NOT_FOUND'
      );
    });
  });

  it('passes when direct deal has no From/Where (filled later in deal card)', async () => {
    await expect(
      validateDealCreate(prismaWithContact() as never, {
        ...baseDto,
        source: undefined,
        sourceDetail: undefined,
      }),
    ).resolves.toBeUndefined();
  });
});
