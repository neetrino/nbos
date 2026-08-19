import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { mergeLeads } from './lead-merge.ops';
import { LEAD_MERGE_ERROR } from './lead-identity.ops';

function mergeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'surv-1',
    code: 'L-2026-0001',
    name: 'IG inquiry',
    contactName: 'Anna',
    phone: null,
    email: null,
    assignedTo: 'seller-1',
    notes: 'Instagram',
    contactId: null,
    source: 'MARKETING',
    sourceDetail: 'SMM',
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: 'acc-1',
    marketingActivityId: null,
    status: 'NEW',
    createdAt: new Date('2026-01-01'),
    trashedAt: null,
    mergedIntoId: null,
    deal: null,
    ...overrides,
  };
}

describe('mergeLeads', () => {
  it('moves ATS events, reassigns Meta when survivor has none, then trashes absorbed', async () => {
    const prisma = createMockPrisma();
    const survivor = mergeRow();
    const absorbed = mergeRow({
      id: 'abs-1',
      code: 'L-2026-0002',
      phone: '+37499123456',
      notes: 'Called',
      source: 'SALES',
      sourceDetail: 'COLD_CALL',
      marketingAccountId: null,
      createdAt: new Date('2026-02-01'),
    });
    prisma.lead.findUnique.mockResolvedValueOnce(survivor).mockResolvedValueOnce(absorbed);
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 2 });
    prisma.metaConversation.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'conv-abs' });
    prisma.leadAdditionalContact.findMany.mockResolvedValue([]);
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await mergeLeads(prisma as never, audit as never, {
      survivorId: 'surv-1',
      absorbedId: 'abs-1',
      fieldChoices: {},
      actorId: 'ceo-1',
      actorRoleSlug: 'ceo',
    });

    expect(result.metaReassigned).toBe(true);
    expect(result.metaUnlinked).toBe(false);
    expect(prisma.metaConversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-abs' },
      data: { leadId: 'surv-1' },
    });
    expect(prisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'abs-1' },
        data: expect.objectContaining({ mergedIntoId: 'surv-1', trashedAt: expect.any(Date) }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'lead.merged',
        entityId: 'surv-1',
        changes: expect.objectContaining({ absorbedId: 'abs-1', metaReassigned: true }),
      }),
    );
  });

  it('unlinks absorbed Meta when survivor already has a conversation', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique
      .mockResolvedValueOnce(mergeRow())
      .mockResolvedValueOnce(
        mergeRow({ id: 'abs-1', code: 'L-2', createdAt: new Date('2026-02-01') }),
      );
    prisma.metaConversation.findUnique
      .mockResolvedValueOnce({ id: 'conv-surv' })
      .mockResolvedValueOnce({ id: 'conv-abs' });
    prisma.leadAdditionalContact.findMany.mockResolvedValue([]);
    const audit = { log: vi.fn().mockResolvedValue({ id: 'a' }) };

    const result = await mergeLeads(prisma as never, audit as never, {
      survivorId: 'surv-1',
      absorbedId: 'abs-1',
      fieldChoices: {},
      actorId: 'ceo-1',
      actorRoleSlug: 'ceo',
    });

    expect(result.metaUnlinked).toBe(true);
    expect(prisma.metaConversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-abs' },
      data: { leadId: null },
    });
  });

  it('fills empty survivor Contact from absorbed', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique
      .mockResolvedValueOnce(mergeRow({ contactId: null }))
      .mockResolvedValueOnce(
        mergeRow({
          id: 'abs-1',
          code: 'L-2',
          contactId: 'contact-abs',
          createdAt: new Date('2026-02-01'),
        }),
      );
    prisma.metaConversation.findUnique.mockResolvedValue(null);
    prisma.leadAdditionalContact.findMany.mockResolvedValue([]);
    const audit = { log: vi.fn().mockResolvedValue({ id: 'a' }) };

    await mergeLeads(prisma as never, audit as never, {
      survivorId: 'surv-1',
      absorbedId: 'abs-1',
      fieldChoices: {},
      actorId: 'ceo-1',
      actorRoleSlug: 'ceo',
    });

    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'surv-1' },
      data: { contactId: 'contact-abs' },
    });
  });

  it('adds a different absorbed primary Contact as an extra on survivor', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique
      .mockResolvedValueOnce(mergeRow({ contactId: 'contact-surv' }))
      .mockResolvedValueOnce(
        mergeRow({
          id: 'abs-1',
          code: 'L-2',
          contactId: 'contact-abs',
          createdAt: new Date('2026-02-01'),
        }),
      );
    prisma.metaConversation.findUnique.mockResolvedValue(null);
    prisma.leadAdditionalContact.findMany.mockResolvedValue([]);
    const audit = { log: vi.fn().mockResolvedValue({ id: 'a' }) };

    await mergeLeads(prisma as never, audit as never, {
      survivorId: 'surv-1',
      absorbedId: 'abs-1',
      fieldChoices: {},
      actorId: 'ceo-1',
      actorRoleSlug: 'ceo',
    });

    expect(prisma.leadAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ leadId: 'surv-1', contactId: 'contact-abs' }],
      skipDuplicates: true,
    });
  });

  it('blocks SQL / Deal and Seller when both cards are not theirs', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique
      .mockResolvedValueOnce(mergeRow({ status: 'SQL', deal: { id: 'd1' } }))
      .mockResolvedValueOnce(mergeRow({ id: 'abs-1', code: 'L-2' }));
    const audit = { log: vi.fn() };

    await expect(
      mergeLeads(prisma as never, audit as never, {
        survivorId: 'surv-1',
        absorbedId: 'abs-1',
        fieldChoices: {},
        actorId: 'ceo-1',
        actorRoleSlug: 'ceo',
      }),
    ).rejects.toMatchObject({ response: { code: LEAD_MERGE_ERROR.SQL } });

    prisma.lead.findUnique
      .mockResolvedValueOnce(mergeRow({ assignedTo: 'seller-1' }))
      .mockResolvedValueOnce(mergeRow({ id: 'abs-1', code: 'L-2', assignedTo: 'seller-2' }));

    await expect(
      mergeLeads(prisma as never, audit as never, {
        survivorId: 'surv-1',
        absorbedId: 'abs-1',
        fieldChoices: {},
        actorId: 'seller-1',
        actorRoleSlug: 'seller',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.lead.findUnique
      .mockResolvedValueOnce(mergeRow({ deal: { id: 'd1' } }))
      .mockResolvedValueOnce(mergeRow({ id: 'abs-1', code: 'L-2' }));

    await expect(
      mergeLeads(prisma as never, audit as never, {
        survivorId: 'surv-1',
        absorbedId: 'abs-1',
        fieldChoices: {},
        actorId: 'ceo-1',
        actorRoleSlug: 'ceo',
      }),
    ).rejects.toMatchObject({ response: { code: LEAD_MERGE_ERROR.DEAL } });
  });

  it('blocks already absorbed or trashed cards', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique
      .mockResolvedValueOnce(mergeRow())
      .mockResolvedValueOnce(
        mergeRow({ id: 'abs-1', mergedIntoId: 'other', trashedAt: new Date() }),
      );
    const audit = { log: vi.fn() };

    await expect(
      mergeLeads(prisma as never, audit as never, {
        survivorId: 'surv-1',
        absorbedId: 'abs-1',
        fieldChoices: {},
        actorId: 'ceo-1',
        actorRoleSlug: 'ceo',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
