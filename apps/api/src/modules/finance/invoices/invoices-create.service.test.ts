import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { InvoicesService } from './invoices.service';

describe('InvoicesService create', () => {
  let service: InvoicesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new InvoicesService(prisma as never);
  });

  it('generates code INV-YYYY-NNNN', async () => {
    prisma.invoice.create.mockResolvedValue({
      id: '1',
      code: 'INV-2026-0001',
      amount: 50000,
      payments: [],
      _count: { payments: 0 },
    });
    const result = await service.create({
      projectId: 'p1',
      amount: 50000,
      type: 'PREPAYMENT',
    });
    expect(result.code).toMatch(/^INV-\d{4}-\d{4}$/);
  });

  it('inherits tax status from order when orderId is provided', async () => {
    prisma.order.findUnique.mockResolvedValue({ taxStatus: 'TAX_FREE' });
    prisma.invoice.create.mockResolvedValue({
      id: '2',
      code: 'INV-2026-0002',
      taxStatus: 'TAX_FREE',
      amount: 50000,
      payments: [],
      _count: { payments: 0 },
    });

    await service.create({
      orderId: 'ord-1',
      projectId: 'p1',
      amount: 50000,
      type: 'DEVELOPMENT',
    });

    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'ord-1',
          taxStatus: 'TAX_FREE',
        }),
      }),
    );
  });

  it('rejects invoices without positive amount', async () => {
    await expect(
      service.create({
        projectId: 'p1',
        amount: 0,
        type: 'PREPAYMENT',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('rejects invoices without a project context', async () => {
    await expect(
      service.create({
        projectId: '',
        amount: 50000,
        type: 'PREPAYMENT',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });
});
