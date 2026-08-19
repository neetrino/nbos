import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { pourLeadIntoContact } from './lead-pour-into-contact.ops';
import { LEAD_SVYAZAT_ERROR } from './lead-identity.ops';

function leadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    code: 'L-2026-0100',
    name: 'Site',
    contactName: 'Anna',
    phone: '+37499111111',
    email: null,
    notes: 'Called from Instagram',
    assignedTo: 'seller-1',
    contactId: null,
    status: 'NEW',
    trashedAt: null,
    mergedIntoId: null,
    deal: null,
    ...overrides,
  };
}

function contactRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contact-1',
    firstName: 'Anna',
    lastName: 'Petrosyan',
    phone: '+37499000000',
    email: 'anna@example.com',
    notes: null,
    trashedAt: null,
    extraPhones: [],
    ...overrides,
  };
}

function actor(overrides: { id?: string; roleSlug?: string } = {}) {
  return { actorId: overrides.id ?? 'seller-1', actorRoleSlug: overrides.roleSlug ?? 'seller' };
}

describe('pourLeadIntoContact', () => {
  it('adds an extra phone, appends notes, trashes the Lead, and does not create a Contact', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await pourLeadIntoContact(prisma as never, audit as never, {
      leadId: 'lead-1',
      contactId: 'contact-1',
      ...actor(),
    });

    expect(result.trashed).toBe(true);
    expect(result.phoneHandling).toBe('extra');
    expect(prisma.contact.create).not.toHaveBeenCalled();
    expect(prisma.contactPhone.create).toHaveBeenCalledWith({
      data: { contactId: 'contact-1', e164: '+37499111111' },
      select: { id: true, e164: true, createdAt: true },
    });
    expect(prisma.contact.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'contact-1' },
        data: expect.objectContaining({ notes: expect.stringContaining('L-2026-0100') }),
      }),
    );
    expect(prisma.contact.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ phone: '+37499111111' }) }),
    );
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { contactId: 'contact-1', trashedAt: expect.any(Date) },
    });
    expect(prisma.lead.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mergedIntoId: expect.anything() }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'lead.poured_into_contact' }),
    );
  });

  it('blocks SQL and Lead-with-Deal', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow({ status: 'SQL' }));
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    const audit = { log: vi.fn() };

    await expect(
      pourLeadIntoContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
      }),
    ).rejects.toMatchObject({ response: { code: LEAD_SVYAZAT_ERROR.SQL } });

    prisma.lead.findUnique.mockResolvedValue(leadRow({ deal: { id: 'deal-1' } }));
    await expect(
      pourLeadIntoContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
      }),
    ).rejects.toMatchObject({ response: { code: LEAD_SVYAZAT_ERROR.DEAL } });
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  it('blocks Marketing', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow({ assignedTo: 'm1' }));
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    const audit = { log: vi.fn() };

    await expect(
      pourLeadIntoContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        ...actor({ id: 'm1', roleSlug: 'marketing' }),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
