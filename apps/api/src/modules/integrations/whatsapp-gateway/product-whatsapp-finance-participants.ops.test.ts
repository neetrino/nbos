import { describe, expect, it, vi } from 'vitest';
import { resolveFinanceTemplateParticipants } from './product-whatsapp-finance-participants.ops';

const PHONE = {
  pm: '+37499111111',
  owner: '+37499222222',
  ceo: '+37499333333',
  director: '+37499444444',
  seller: '+37411111111',
} as const;

describe('FINANCE default access template', () => {
  it('adds Owner, CEO, Finance Director, Seller, and Product PM — not developers', async () => {
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'prod-1',
          pmId: 'pm-1',
          order: { dealId: 'deal-1', deal: { id: 'deal-1', seller: seller(), pm: null } },
          teamMembers: [],
          pm: { id: 'pm-1', phone: PHONE.pm },
        }),
      },
      deal: { findUnique: vi.fn() },
      platformOwnership: {
        findUnique: vi.fn().mockResolvedValue({
          ownerEmployeeId: 'owner-1',
          owner: { id: 'owner-1', phone: PHONE.owner },
        }),
      },
      employee: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: 'ceo-1', phone: PHONE.ceo }])
          .mockResolvedValueOnce([{ id: 'fd-1', phone: PHONE.director }]),
      },
    };

    const result = await resolveFinanceTemplateParticipants(prisma as never, 'prod-1');
    const roles = result.candidates.flatMap((row) => row.roles);
    expect(roles).toEqual(
      expect.arrayContaining([
        'OWNER',
        'CEO',
        'FINANCE_DIRECTOR',
        'SALES_MANAGER',
        'PROJECT_MANAGER',
      ]),
    );
    expect(roles).not.toContain('TECHNICAL_SPECIALIST');
    expect(result.candidates.map((row) => row.employeeId)).not.toContain('dev-1');
    expect(result.candidates).toHaveLength(5);
  });
});

function seller() {
  return { id: 'seller-1', phone: PHONE.seller };
}
