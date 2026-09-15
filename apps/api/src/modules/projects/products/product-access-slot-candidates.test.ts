import { describe, expect, it } from 'vitest';
import {
  ACCESS_SLOT_CANDIDATE_PAGE_SIZE,
  buildAccessSlotCandidateWhere,
  pageAccessSlotCandidates,
} from './product-access-slot-candidates';

describe('buildAccessSlotCandidateWhere', () => {
  it('limits to the product project or shared infra and excludes bound ids', () => {
    const where = buildAccessSlotCandidateWhere({
      productProjectId: 'proj-1',
      allowedCategories: ['HOSTING'],
      excludeCredentialIds: ['already-bound'],
      visibility: { OR: [{ accessLevel: 'SECRET' }] },
    });
    expect(where.category).toEqual({ in: ['HOSTING'] });
    expect(where.id).toEqual({ notIn: ['already-bound'] });
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { OR: [{ projectId: 'proj-1' }, { projectId: null }] },
        { OR: [{ accessLevel: 'SECRET' }] },
      ]),
    );
  });

  it('adds name and login search when a query is present', () => {
    const where = buildAccessSlotCandidateWhere({
      productProjectId: 'proj-1',
      allowedCategories: ['DOMAIN'],
      excludeCredentialIds: [],
      visibility: {},
      search: 'beget',
    });
    expect(where.AND).toEqual(
      expect.arrayContaining([
        {
          OR: [
            { name: { contains: 'beget', mode: 'insensitive' } },
            { login: { contains: 'beget', mode: 'insensitive' } },
          ],
        },
      ]),
    );
  });

  it('pages candidates with a hasMore flag when take+1 overflows', () => {
    const rows = Array.from({ length: ACCESS_SLOT_CANDIDATE_PAGE_SIZE + 1 }, (_, i) => i);
    expect(pageAccessSlotCandidates(rows)).toEqual({
      items: rows.slice(0, ACCESS_SLOT_CANDIDATE_PAGE_SIZE),
      hasMore: true,
    });
    expect(pageAccessSlotCandidates(rows.slice(0, ACCESS_SLOT_CANDIDATE_PAGE_SIZE))).toEqual({
      items: rows.slice(0, ACCESS_SLOT_CANDIDATE_PAGE_SIZE),
      hasMore: false,
    });
  });
});
