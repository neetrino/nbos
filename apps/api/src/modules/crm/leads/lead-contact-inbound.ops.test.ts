import { describe, expect, it, vi } from 'vitest';
import { resolveContactPhoneInbound } from './lead-contact-inbound.ops';

describe('resolveContactPhoneInbound', () => {
  it('returns the open Deal original Lead when the Contact has no open Lead', async () => {
    const db = {
      contact: { findFirst: vi.fn().mockResolvedValue({ id: 'c-1' }) },
      lead: { findFirst: vi.fn().mockResolvedValue(null) },
      deal: { findFirst: vi.fn().mockResolvedValue({ id: 'd-1', leadId: 'sql-1' }) },
    };
    const result = await resolveContactPhoneInbound(db as never, '+37499123456');
    expect(result).toEqual({ existingLeadId: 'sql-1', contactId: 'c-1', hasOpenDeal: true });
  });

  it('prefers an open non-SQL Lead of the Contact over the Deal thread', async () => {
    const db = {
      contact: { findFirst: vi.fn().mockResolvedValue({ id: 'c-1' }) },
      lead: { findFirst: vi.fn().mockResolvedValue({ id: 'open-1' }) },
      deal: { findFirst: vi.fn() },
    };
    const result = await resolveContactPhoneInbound(db as never, '+37499123456');
    expect(result).toEqual({ existingLeadId: 'open-1', contactId: 'c-1', hasOpenDeal: false });
    expect(db.deal.findFirst).not.toHaveBeenCalled();
  });

  it('returns contactId only when there is no open Deal', async () => {
    const db = {
      contact: { findFirst: vi.fn().mockResolvedValue({ id: 'c-1' }) },
      lead: { findFirst: vi.fn().mockResolvedValue(null) },
      deal: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const result = await resolveContactPhoneInbound(db as never, '+37499123456');
    expect(result).toEqual({ existingLeadId: null, contactId: 'c-1', hasOpenDeal: false });
  });

  it('looks up Contact by primary or extra phone', async () => {
    const db = {
      contact: { findFirst: vi.fn().mockResolvedValue(null) },
      lead: { findFirst: vi.fn() },
      deal: { findFirst: vi.fn() },
    };
    await resolveContactPhoneInbound(db as never, '+37499123456');
    expect(db.contact.findFirst).toHaveBeenCalledWith({
      where: {
        trashedAt: null,
        OR: [
          { phone: { in: expect.arrayContaining(['+37499123456']) } },
          { extraPhones: { some: { e164: { in: expect.arrayContaining(['+37499123456']) } } } },
        ],
      },
      select: { id: true },
    });
  });

  it('flags an open Deal even when Deal.leadId is empty so ATS will not create a Lead', async () => {
    const db = {
      contact: { findFirst: vi.fn().mockResolvedValue({ id: 'c-1' }) },
      lead: { findFirst: vi.fn().mockResolvedValue(null) },
      deal: { findFirst: vi.fn().mockResolvedValue({ id: 'd-1', leadId: null }) },
    };
    const result = await resolveContactPhoneInbound(db as never, '+37499123456');
    expect(result).toEqual({ existingLeadId: null, contactId: 'c-1', hasOpenDeal: true });
  });
});
