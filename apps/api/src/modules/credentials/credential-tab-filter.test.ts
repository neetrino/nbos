import { describe, expect, it } from 'vitest';
import type { Prisma } from '@nbos/database';
import { applyCredentialTabFilter } from './credential-tab-filter';
import type { CredentialVisibilityContext } from './credentials-visibility';

describe('applyCredentialTabFilter', () => {
  const visibilityCtx: CredentialVisibilityContext = {
    employeeId: 'emp-1',
    departmentIds: ['dept-1'],
    projectIds: [],
    productIds: [],
    manualGrantCredentialIds: [],
  };

  it('filters company tab to ALL access level when row bypass is enabled', () => {
    const where: Prisma.CredentialWhereInput = {};
    applyCredentialTabFilter(where, 'company', 'emp-1', visibilityCtx, true);
    expect(where).toEqual({ accessLevel: 'ALL' });
  });

  it('applies visibility ALL branch on company tab when row bypass is off', () => {
    const where: Prisma.CredentialWhereInput = {};
    applyCredentialTabFilter(where, 'company', 'emp-1', visibilityCtx, false);
    expect(where).toEqual({ accessLevel: 'ALL' });
  });
});
