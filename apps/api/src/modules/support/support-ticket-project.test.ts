import { describe, expect, it, vi } from 'vitest';
import { resolveSupportTicketProjectId } from './support-ticket-project';

describe('resolveSupportTicketProjectId', () => {
  it('infers project from product when projectId is omitted', async () => {
    const prisma = {
      product: { findUnique: vi.fn().mockResolvedValue({ projectId: 'proj-1' }) },
    };
    await expect(resolveSupportTicketProjectId(prisma as never, 'prod-1', undefined)).resolves.toBe(
      'proj-1',
    );
  });

  it('prefers an explicit projectId', async () => {
    const prisma = { product: { findUnique: vi.fn() } };
    await expect(
      resolveSupportTicketProjectId(prisma as never, 'prod-1', 'proj-explicit'),
    ).resolves.toBe('proj-explicit');
    expect(prisma.product.findUnique).not.toHaveBeenCalled();
  });
});
