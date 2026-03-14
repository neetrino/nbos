import { describe, it, expect, beforeEach } from 'vitest';
import { LeadConversionService } from './lead-conversion.service';
import { LeadsService } from './leads.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LeadConversionService', () => {
  let service: LeadConversionService;
  let leadsService: LeadsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    leadsService = new LeadsService(prisma as never);
    service = new LeadConversionService(prisma as never, leadsService);
  });

  const baseLead = {
    id: 'lead-1',
    code: 'L-2026-0001',
    contactName: 'John Doe',
    status: 'SQL',
    source: 'WEBSITE',
    phone: '+37499123456',
    email: 'john@example.com',
    contactId: null,
    deal: null,
  };

  const convertDto = {
    dealType: 'NEW_CLIENT',
    amount: 50000,
    paymentType: 'CLASSIC',
    sellerId: 'seller-1',
  };

  it('converts lead to deal successfully', async () => {
    prisma.lead.findUnique.mockResolvedValue(baseLead);
    prisma.deal.findFirst.mockResolvedValue(null);
    prisma.contact.create.mockResolvedValue({ id: 'new-contact-1' });
    prisma.deal.create.mockResolvedValue({
      id: 'deal-1',
      code: 'D-2026-0001',
      type: 'NEW_CLIENT',
    });

    const result = await service.convertToDeal('lead-1', convertDto);
    expect(result.code).toBe('D-2026-0001');
  });

  it('creates contact if lead has no contactId', async () => {
    prisma.lead.findUnique.mockResolvedValue({ ...baseLead, contactId: null });
    prisma.deal.findFirst.mockResolvedValue(null);
    prisma.contact.create.mockResolvedValue({ id: 'new-contact' });
    prisma.deal.create.mockResolvedValue({ id: 'deal-1', code: 'D-2026-0001' });

    await service.convertToDeal('lead-1', convertDto);
    expect(prisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
        }),
      }),
    );
  });

  it('reuses existing contactId if lead has one', async () => {
    prisma.lead.findUnique.mockResolvedValue({ ...baseLead, contactId: 'existing-contact' });
    prisma.deal.findFirst.mockResolvedValue(null);
    prisma.deal.create.mockResolvedValue({ id: 'deal-1', code: 'D-2026-0001' });

    await service.convertToDeal('lead-1', convertDto);
    expect(prisma.contact.create).not.toHaveBeenCalled();
    expect(prisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contactId: 'existing-contact' }),
      }),
    );
  });

  it('throws BadRequestException if lead is not in SQL status', async () => {
    prisma.lead.findUnique.mockResolvedValue({ ...baseLead, status: 'NEW' });

    await expect(service.convertToDeal('lead-1', convertDto)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException if lead already has a deal', async () => {
    prisma.lead.findUnique.mockResolvedValue({
      ...baseLead,
      deal: { id: 'existing-deal' },
    });

    await expect(service.convertToDeal('lead-1', convertDto)).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException if lead not found', async () => {
    prisma.lead.findUnique.mockResolvedValue(null);
    await expect(service.convertToDeal('missing', convertDto)).rejects.toThrow(NotFoundException);
  });

  it('increments deal code when existing deals exist', async () => {
    prisma.lead.findUnique.mockResolvedValue({ ...baseLead, contactId: 'c1' });
    prisma.deal.findFirst.mockResolvedValue({ code: 'D-2026-0042' });
    prisma.deal.create.mockImplementation(({ data }) => Promise.resolve({ id: 'd-1', ...data }));

    await service.convertToDeal('lead-1', convertDto);
    expect(prisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'D-2026-0043' }),
      }),
    );
  });
});
