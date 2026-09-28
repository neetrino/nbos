import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  bindAuthenticatedApprover,
  financePayScope,
  type FinancePayActor,
} from './finance-pay-access';

const ACTOR: FinancePayActor = {
  id: 'actor-1',
  permissions: { FINANCE_SALARY_VIEW: 'ALL' },
  departmentIds: [],
};

describe('bindAuthenticatedApprover', () => {
  it('stores the actor when the client omits approvedById', () => {
    expect(bindAuthenticatedApprover(ACTOR.id, undefined)).toBe('actor-1');
    expect(bindAuthenticatedApprover(ACTOR.id, null)).toBe('actor-1');
  });

  it('stores the actor when the supplied id matches', () => {
    expect(bindAuthenticatedApprover(ACTOR.id, 'actor-1')).toBe('actor-1');
  });

  it('rejects a foreign approvedById', () => {
    expect(() => bindAuthenticatedApprover(ACTOR.id, 'other-person')).toThrow(BadRequestException);
  });
});

describe('financePayScope', () => {
  it('treats a missing grant as NONE', () => {
    expect(financePayScope({ ...ACTOR, permissions: {} }, 'FINANCE_SALARY', 'VIEW')).toBe('NONE');
  });
});
