import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { ClientServicesService } from './client-services.service';

describe('ClientServicesService', () => {
  let service: ClientServicesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ClientServicesService(prisma as never);
  });

  it('findAll returns paginated client service records', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([
      {
        id: 'svc-1',
        name: 'Client domain',
        ourCost: new Decimal('12'),
        clientCharge: new Decimal('20'),
      },
    ]);
    prisma.clientServiceRecord.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, pageSize: 20 });

    expect(result.items[0].ourCost).toBe('12');
    expect(result.meta.total).toBe(1);
  });

  it('create rejects missing project', async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        projectId: 'missing',
        type: 'DOMAIN',
        name: 'example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create rejects product from another project', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    prisma.product.findUnique.mockResolvedValue({ projectId: 'project-2' });

    await expect(
      service.create({
        projectId: 'project-1',
        productId: 'product-1',
        type: 'HOSTING',
        name: 'Production hosting',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create persists client-paid service defaults', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    prisma.clientServiceRecord.create = vi.fn().mockResolvedValue({
      id: 'svc-1',
      name: 'Apple Developer',
      ourCost: new Decimal('99'),
      clientCharge: new Decimal('149'),
    });

    const result = await service.create({
      projectId: 'project-1',
      type: 'ACCOUNT',
      name: 'Apple Developer',
      ourCost: 99,
      clientCharge: 149,
    });

    expect(result.clientCharge).toBe('149');
    expect(prisma.clientServiceRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          billingModel: 'CLIENT_PAID',
          pricingModel: 'FIXED',
          frequency: 'YEARLY',
        }),
      }),
    );
  });

  it('findById throws when service is missing', async () => {
    prisma.clientServiceRecord.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
