import { describe, expect, it, vi } from 'vitest';
import { AtsCallRedirectService } from './ats-call-redirect.service';
import type { AtsWebhookPayload } from './ats.types';

function inboundStart(overrides: Partial<AtsWebhookPayload> = {}): AtsWebhookPayload {
  return {
    state: 'start',
    uid: 'call-redirect-1',
    input: null,
    clid: '+37499123456',
    op: null,
    rate: null,
    billsec: null,
    calldirect: '0',
    disposition: null,
    channel: null,
    recordLink: null,
    ...overrides,
  };
}

type PrismaStub = {
  contact: { findFirst: ReturnType<typeof vi.fn> };
  deal: { findFirst: ReturnType<typeof vi.fn> };
  lead: { findFirst: ReturnType<typeof vi.fn> };
};

function createService(prisma: PrismaStub): AtsCallRedirectService {
  return new AtsCallRedirectService(prisma as never);
}

describe('AtsCallRedirectService', () => {
  it('returns SIP when Contact matched via Deal.seller sipId', async () => {
    const prisma: PrismaStub = {
      contact: { findFirst: vi.fn().mockResolvedValue({ id: 'contact-1' }) },
      deal: {
        findFirst: vi.fn().mockResolvedValue({
          seller: { id: 'emp-1', sipId: '3126107' },
        }),
      },
      lead: { findFirst: vi.fn() },
    };
    const service = createService(prisma);

    await expect(service.resolveRedirectCall(inboundStart())).resolves.toBe('3126107');
    expect(prisma.lead.findFirst).not.toHaveBeenCalled();
  });

  it('returns SIP when Lead matched with assignee sipId (no Contact)', async () => {
    const prisma: PrismaStub = {
      contact: { findFirst: vi.fn().mockResolvedValue(null) },
      deal: { findFirst: vi.fn() },
      lead: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'lead-1',
          assignedTo: 'emp-2',
          assignee: { id: 'emp-2', sipId: '998877' },
        }),
      },
    };
    const service = createService(prisma);

    await expect(service.resolveRedirectCall(inboundStart())).resolves.toBe('998877');
  });

  it('returns null for unknown phone (new caller)', async () => {
    const prisma: PrismaStub = {
      contact: { findFirst: vi.fn().mockResolvedValue(null) },
      deal: { findFirst: vi.fn() },
      lead: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const service = createService(prisma);

    await expect(service.resolveRedirectCall(inboundStart())).resolves.toBeNull();
  });

  it('returns null when Lead exists but assignee has no sipId', async () => {
    const prisma: PrismaStub = {
      contact: { findFirst: vi.fn().mockResolvedValue(null) },
      deal: { findFirst: vi.fn() },
      lead: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'lead-1',
          assignedTo: 'emp-2',
          assignee: { id: 'emp-2', sipId: null },
        }),
      },
    };
    const service = createService(prisma);

    await expect(service.resolveRedirectCall(inboundStart())).resolves.toBeNull();
  });

  it('skips redirect on finish / end', async () => {
    const prisma: PrismaStub = {
      contact: { findFirst: vi.fn() },
      deal: { findFirst: vi.fn() },
      lead: { findFirst: vi.fn() },
    };
    const service = createService(prisma);

    await expect(
      service.resolveRedirectCall(inboundStart({ state: 'finish' })),
    ).resolves.toBeNull();
    await expect(service.resolveRedirectCall(inboundStart({ state: 'end' }))).resolves.toBeNull();
    expect(prisma.contact.findFirst).not.toHaveBeenCalled();
  });

  it('prefers Contact over Lead when both could match', async () => {
    const prisma: PrismaStub = {
      contact: { findFirst: vi.fn().mockResolvedValue({ id: 'contact-1' }) },
      deal: {
        findFirst: vi.fn().mockResolvedValue({
          seller: { id: 'emp-1', sipId: '111' },
        }),
      },
      lead: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'lead-1',
          assignedTo: 'emp-2',
          assignee: { id: 'emp-2', sipId: '222' },
        }),
      },
    };
    const service = createService(prisma);

    await expect(service.resolveRedirectCall(inboundStart())).resolves.toBe('111');
    expect(prisma.lead.findFirst).not.toHaveBeenCalled();
  });
});
