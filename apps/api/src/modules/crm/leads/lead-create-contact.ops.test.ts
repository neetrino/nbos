import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { createContactFromLead } from './lead-create-contact.ops';
import { LEAD_SVYAZAT_ERROR } from './lead-identity.ops';

function leadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    code: 'L-2026-0200',
    name: 'App',
    contactName: 'Karen Sargsyan',
    phone: '+37499222222',
    email: 'karen@example.com',
    notes: null,
    assignedTo: 'seller-1',
    contactId: null,
    status: 'NEW',
    trashedAt: null,
    mergedIntoId: null,
    deal: null,
    ...overrides,
  };
}

function actor(overrides: { id?: string; roleSlug?: string } = {}) {
  return { actorId: overrides.id ?? 'seller-1', actorRoleSlug: overrides.roleSlug ?? 'seller' };
}

function openDealRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'deal-1',
    contactId: 'primary-1',
    projectId: 'project-1',
    leadId: 'sql-lead-1',
    status: 'START_CONVERSATION',
    trashedAt: null,
    ...overrides,
  };
}

describe('createContactFromLead', () => {
  it('creates a Contact, sets contactId, and keeps the Lead when not attaching', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.create.mockResolvedValue({ id: 'contact-new' });
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await createContactFromLead(prisma as never, audit as never, {
      leadId: 'lead-1',
      ...actor(),
    });

    expect(result.trashed).toBe(false);
    expect(result.contactId).toBe('contact-new');
    expect(prisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'Karen',
          lastName: 'Sargsyan',
          phone: '+37499222222',
          email: 'karen@example.com',
        }),
      }),
    );
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { contactId: 'contact-new' },
    });
    expect(prisma.lead.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ trashedAt: expect.any(Date) }) }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'lead.contact_created' }),
    );
  });

  it('attaches to an open Deal and its Project, trashes the Lead, leaves Deal.leadId', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.create.mockResolvedValue({ id: 'contact-new' });
    prisma.deal.findUnique.mockResolvedValue(openDealRow());
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      contactId: 'project-primary',
      trashedAt: null,
    });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 0 });
    prisma.metaConversation.findUnique.mockResolvedValue(null);
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await createContactFromLead(prisma as never, audit as never, {
      leadId: 'lead-1',
      attach: { type: 'deal', id: 'deal-1' },
      ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
    });

    expect(result.trashed).toBe(true);
    expect(result.cascadedProjectId).toBe('project-1');
    expect(prisma.deal.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ leadId: expect.anything() }) }),
    );
    expect(prisma.deal.create).not.toHaveBeenCalled();
    expect(prisma.dealAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ dealId: 'deal-1', contactId: 'contact-new' }],
      skipDuplicates: true,
    });
    expect(prisma.projectAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ projectId: 'project-1', contactId: 'contact-new' }],
      skipDuplicates: true,
    });
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { contactId: 'contact-new', trashedAt: expect.any(Date) },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'lead.contact_created_and_attached' }),
    );
  });

  it('attaches to a Project as additional and trashes the Lead', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.contact.create.mockResolvedValue({ id: 'contact-new' });
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      contactId: 'project-primary',
      trashedAt: null,
    });
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await createContactFromLead(prisma as never, audit as never, {
      leadId: 'lead-1',
      attach: { type: 'project', id: 'project-1' },
      ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
    });

    expect(result.trashed).toBe(true);
    expect(prisma.projectAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ projectId: 'project-1', contactId: 'contact-new' }],
      skipDuplicates: true,
    });
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  it('attaches to another open Lead as additional and trashes this Lead', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique
      .mockResolvedValueOnce(leadRow())
      .mockResolvedValueOnce(
        leadRow({ id: 'lead-2', contactId: 'other-contact', deal: null, status: 'MQL' }),
      );
    prisma.contact.create.mockResolvedValue({ id: 'contact-new' });
    prisma.atsCallEvent.updateMany.mockResolvedValue({ count: 1 });
    prisma.metaConversation.findUnique.mockResolvedValue(null);
    const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };

    const result = await createContactFromLead(prisma as never, audit as never, {
      leadId: 'lead-1',
      attach: { type: 'lead', id: 'lead-2' },
      ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
    });

    expect(result.trashed).toBe(true);
    expect(prisma.leadAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ leadId: 'lead-2', contactId: 'contact-new' }],
      skipDuplicates: true,
    });
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { contactId: 'contact-new', trashedAt: expect.any(Date) },
    });
  });

  it('blocks SQL / Deal on create and Marketing', async () => {
    const prisma = createMockPrisma();
    prisma.lead.findUnique.mockResolvedValue(leadRow({ status: 'SQL' }));
    const audit = { log: vi.fn() };

    await expect(
      createContactFromLead(prisma as never, audit as never, {
        leadId: 'lead-1',
        ...actor({ roleSlug: 'ceo', id: 'ceo-1' }),
      }),
    ).rejects.toMatchObject({ response: { code: LEAD_SVYAZAT_ERROR.SQL } });

    prisma.lead.findUnique.mockResolvedValue(leadRow({ assignedTo: 'm1' }));
    await expect(
      createContactFromLead(prisma as never, audit as never, {
        leadId: 'lead-1',
        ...actor({ id: 'm1', roleSlug: 'marketing' }),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
