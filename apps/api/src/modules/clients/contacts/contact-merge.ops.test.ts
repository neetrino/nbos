import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { mergeContacts } from './contact-merge.ops';
import { CONTACT_MERGE_ERROR } from './contact-merge-guards.ops';

function contactRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'surv-1',
    firstName: 'Anna',
    lastName: 'Sargsyan',
    phone: '+37499000000',
    email: 'anna@old.test',
    role: 'CLIENT',
    notes: 'Survivor note',
    messengerLinks: null,
    trashedAt: null,
    mergedIntoId: null,
    extraPhones: [{ id: 'p-s', e164: '+37499111111', createdAt: new Date() }],
    ...overrides,
  };
}

describe('mergeContacts', () => {
  it('picks absorbed fields, unions extra phones, and re-points Deal/Lead/Company', async () => {
    const prisma = createMockPrisma();
    prisma.contact.findUnique.mockResolvedValueOnce(contactRow()).mockResolvedValueOnce(
      contactRow({
        id: 'abs-1',
        firstName: 'Anahit',
        lastName: 'Sargsyan',
        phone: '+37499222222',
        email: 'anahit@new.test',
        role: 'PARTNER',
        notes: 'Absorbed note',
        extraPhones: [{ id: 'p-a', e164: '+37499333333', createdAt: new Date() }],
      }),
    );
    prisma.company.updateMany.mockResolvedValue({ count: 1 });
    prisma.lead.updateMany.mockResolvedValue({ count: 1 });
    prisma.deal.updateMany.mockResolvedValue({ count: 1 });
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    await mergeContacts(prisma as never, audit as never, {
      survivorId: 'surv-1',
      absorbedId: 'abs-1',
      fieldChoices: {
        firstName: 'absorbed',
        phone: 'absorbed',
        email: 'absorbed',
        role: 'absorbed',
      },
      actorId: 'ceo-1',
      actorRoleSlug: 'ceo',
    });

    expect(prisma.contact.update).toHaveBeenCalledWith({
      where: { id: 'surv-1' },
      data: expect.objectContaining({
        firstName: 'Anahit',
        lastName: 'Sargsyan',
        phone: '+37499222222',
        email: 'anahit@new.test',
        role: 'PARTNER',
        notes: 'Survivor note\nAbsorbed note',
      }),
    });
    expect(prisma.contactPhone.deleteMany).toHaveBeenCalledWith({
      where: { contactId: { in: ['surv-1', 'abs-1'] } },
    });
    expect(prisma.contactPhone.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { contactId: 'surv-1', e164: '+37499000000' },
        { contactId: 'surv-1', e164: '+37499111111' },
        { contactId: 'surv-1', e164: '+37499333333' },
      ]),
    });
    expect(prisma.deal.updateMany).toHaveBeenCalledWith({
      where: { contactId: 'abs-1' },
      data: { contactId: 'surv-1' },
    });
    expect(prisma.lead.updateMany).toHaveBeenCalledWith({
      where: { contactId: 'abs-1' },
      data: { contactId: 'surv-1' },
    });
    expect(prisma.company.updateMany).toHaveBeenCalledWith({
      where: { contactId: 'abs-1' },
      data: { contactId: 'surv-1' },
    });
    expect(prisma.contact.update).toHaveBeenCalledWith({
      where: { id: 'abs-1' },
      data: expect.objectContaining({ mergedIntoId: 'surv-1', trashedAt: expect.any(Date) }),
    });
    expect(prisma.contact.delete).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'contact.merged',
        entityId: 'surv-1',
        changes: expect.objectContaining({ absorbedId: 'abs-1' }),
      }),
    );
  });

  it('blocks Seller and Marketing with 403', async () => {
    const prisma = createMockPrisma();
    const audit = { log: vi.fn() };
    await expect(
      mergeContacts(prisma as never, audit as never, {
        survivorId: 'surv-1',
        absorbedId: 'abs-1',
        fieldChoices: {},
        actorId: 's-1',
        actorRoleSlug: 'seller',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      mergeContacts(prisma as never, audit as never, {
        survivorId: 'surv-1',
        absorbedId: 'abs-1',
        fieldChoices: {},
        actorId: 'm-1',
        actorRoleSlug: 'marketing',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.contact.findUnique).not.toHaveBeenCalled();
  });

  it('blocks merging a contact into itself', async () => {
    const prisma = createMockPrisma();
    await expect(
      mergeContacts(prisma as never, { log: vi.fn() } as never, {
        survivorId: 'surv-1',
        absorbedId: 'surv-1',
        fieldChoices: {},
        actorId: 'ceo-1',
        actorRoleSlug: 'ceo',
      }),
    ).rejects.toMatchObject({ response: { code: CONTACT_MERGE_ERROR.SAME_CONTACT } });
  });

  it('blocks already absorbed or trashed contacts', async () => {
    const prisma = createMockPrisma();
    prisma.contact.findUnique
      .mockResolvedValueOnce(contactRow())
      .mockResolvedValueOnce(
        contactRow({ id: 'abs-1', mergedIntoId: 'other', trashedAt: new Date() }),
      );

    await expect(
      mergeContacts(prisma as never, { log: vi.fn() } as never, {
        survivorId: 'surv-1',
        absorbedId: 'abs-1',
        fieldChoices: {},
        actorId: 'pm-1',
        actorRoleSlug: 'pm',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.contact.delete).not.toHaveBeenCalled();
  });
});
