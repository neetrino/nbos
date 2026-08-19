import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { attachLeadToContact } from './lead-attach-contact.ops';
import { LEAD_ATTACH_ERROR } from './lead-identity.ops';

function leadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    code: 'L-2026-0100',
    phone: '+37499111111',
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
    phone: null,
    notes: null,
    trashedAt: null,
    extraPhones: [],
    ...overrides,
  };
}

function dealRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'deal-1',
    code: 'D-2026-0001',
    status: 'START_CONVERSATION',
    contactId: 'contact-1',
    leadId: 'sql-lead-1',
    notes: null,
    trashedAt: null,
    ...overrides,
  };
}

function actor(overrides: { id?: string; roleSlug?: string } = {}) {
  return { actorId: overrides.id ?? 'seller-1', actorRoleSlug: overrides.roleSlug ?? 'seller' };
}

describe('attachLeadToContact', () => {
  it('sets contactId and writes empty Contact.phone', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await attachLeadToContact(prisma as never, audit as never, {
      leadId: 'lead-1',
      contactId: 'contact-1',
      ...actor(),
    });

    expect(result.trashed).toBe(false);
    expect(result.phoneHandling).toBe('written');
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { contactId: 'contact-1' },
    });
    expect(prisma.contact.update).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
      data: { phone: '+37499111111' },
    });
    expect(prisma.lead.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ trashedAt: expect.any(Date) }) }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'lead.attached_to_contact',
        changes: expect.objectContaining({
          contactId: 'contact-1',
          aboutDealId: null,
          phoneHandling: 'written',
        }),
      }),
    );
  });

  it('adds a different Lead phone as an extra and does not overwrite primary', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(contactRow({ phone: '+37499000000' }));
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await attachLeadToContact(prisma as never, audit as never, {
      leadId: 'lead-1',
      contactId: 'contact-1',
      ...actor(),
    });

    expect(result.phoneHandling).toBe('extra');
    expect(prisma.contactPhone.create).toHaveBeenCalledWith({
      data: { contactId: 'contact-1', e164: '+37499111111' },
      select: { id: true, e164: true, createdAt: true },
    });
    expect(prisma.contact.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ phone: '+37499111111' }) }),
    );
    expect(prisma.contact.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ notes: expect.anything() }) }),
    );
  });

  it('does not store a duplicate extra when the number already exists', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(
      contactRow({ phone: '+37499000000', extraPhones: [{ e164: '+37499111111' }] }),
    );
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await attachLeadToContact(prisma as never, audit as never, {
      leadId: 'lead-1',
      contactId: 'contact-1',
      ...actor(),
    });

    expect(result.phoneHandling).toBe('same');
    expect(prisma.contactPhone.create).not.toHaveBeenCalled();
  });

  it('trashes the stray Lead for an open Deal and does not change Deal.leadId', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    prisma.deal.findUnique.mockResolvedValue(dealRow());
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });
    prisma.metaConversation.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await attachLeadToContact(prisma as never, audit as never, {
      leadId: 'lead-1',
      contactId: 'contact-1',
      aboutDealId: 'deal-1',
      ...actor({ id: 'ceo-1', roleSlug: 'ceo' }),
    });

    expect(result.trashed).toBe(true);
    expect(result.aboutDealId).toBe('deal-1');
    expect(prisma.deal.create).not.toHaveBeenCalled();
    expect(prisma.deal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'deal-1' },
        data: expect.objectContaining({ notes: expect.stringContaining('L-2026-0100') }),
      }),
    );
    expect(prisma.deal.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ leadId: expect.anything() }) }),
    );
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { trashedAt: expect.any(Date) },
    });
    expect(prisma.atsCallEvent.updateMany).toHaveBeenCalledWith({
      where: { leadId: 'lead-1' },
      data: { leadId: 'sql-lead-1' },
    });
  });

  it('rejects aboutDealId when the Deal is Won or Failed', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    prisma.deal.findUnique.mockResolvedValue(dealRow({ status: 'WON' }));
    const audit = { log: vi.fn() };

    await expect(
      attachLeadToContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        aboutDealId: 'deal-1',
        ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
      }),
    ).rejects.toMatchObject({
      response: { code: LEAD_ATTACH_ERROR.DEAL_NOT_OPEN },
    });
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  it('keeps the Lead when attaching without aboutDealId', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(contactRow({ phone: '+37499111111' }));
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await attachLeadToContact(prisma as never, audit as never, {
      leadId: 'lead-1',
      contactId: 'contact-1',
      ...actor(),
    });

    expect(result.trashed).toBe(false);
    expect(result.phoneHandling).toBe('same');
    expect(prisma.lead.update).toHaveBeenCalledTimes(1);
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { contactId: 'contact-1' },
    });
  });

  it('allows Seller on their assigned Lead', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow({ assignedTo: 'seller-1' }));
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    await expect(
      attachLeadToContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        ...actor({ id: 'seller-1', roleSlug: 'seller' }),
      }),
    ).resolves.toMatchObject({ contactId: 'contact-1' });
  });

  it('blocks Seller on someone else’s Lead', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow({ assignedTo: 'other-seller' }));
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    const audit = { log: vi.fn() };

    await expect(
      attachLeadToContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        ...actor({ id: 'seller-1', roleSlug: 'seller' }),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks Marketing from attaching', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow({ assignedTo: 'm1' }));
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    const audit = { log: vi.fn() };

    await expect(
      attachLeadToContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        ...actor({ id: 'm1', roleSlug: 'marketing' }),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects aboutDealId when the Deal belongs to another Contact', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    prisma.deal.findUnique.mockResolvedValue(dealRow({ contactId: 'other-contact' }));
    const audit = { log: vi.fn() };

    await expect(
      attachLeadToContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        aboutDealId: 'deal-1',
        ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
      }),
    ).rejects.toMatchObject({
      response: { code: LEAD_ATTACH_ERROR.DEAL_CONTACT_MISMATCH },
    });
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  it('rejects aboutDealId when the Deal has no Contact', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    prisma.deal.findUnique.mockResolvedValue(dealRow({ contactId: null }));
    const audit = { log: vi.fn() };

    await expect(
      attachLeadToContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        aboutDealId: 'deal-1',
        ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
      }),
    ).rejects.toMatchObject({
      response: { code: LEAD_ATTACH_ERROR.DEAL_CONTACT_MISMATCH },
    });
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  it('rejects Failed Deal the same as Won', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.findUnique.mockResolvedValue(contactRow());
    prisma.deal.findUnique.mockResolvedValue(dealRow({ status: 'FAILED' }));
    const audit = { log: vi.fn() };

    await expect(
      attachLeadToContact(prisma as never, audit as never, {
        leadId: 'lead-1',
        contactId: 'contact-1',
        aboutDealId: 'deal-1',
        ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
