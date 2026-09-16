import { describe, expect, it } from 'vitest';
import {
  EXPENSE_CREDENTIAL_SELECT,
  EXPENSE_PLAN_CREDENTIAL_SELECT,
  EXPENSE_PLAN_DETAIL_INCLUDE,
} from './expense-relation-include';

const CREDENTIAL_SECRET_KEYS = [
  'login',
  'password',
  'passphrase',
  'apiKey',
  'envData',
  'secureNotes',
] as const;

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  for (const [key, nested] of Object.entries(value)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

describe('expense-plan credential select', () => {
  it('omits vault secrets from the plan Prisma shape', () => {
    const keys = collectKeys(EXPENSE_PLAN_DETAIL_INCLUDE);
    expect(keys.has('credential')).toBe(true);
    for (const secret of CREDENTIAL_SECRET_KEYS) {
      expect(keys.has(secret), `leaked ${secret}`).toBe(false);
    }
  });

  it('uses the plan credential select, not the expense-card select that includes login', () => {
    expect(EXPENSE_PLAN_DETAIL_INCLUDE.credential.select).toBe(EXPENSE_PLAN_CREDENTIAL_SELECT);
    expect(EXPENSE_PLAN_CREDENTIAL_SELECT).toEqual({ id: true, name: true, url: true });
    expect(EXPENSE_CREDENTIAL_SELECT).toMatchObject({ login: true });
    expect(EXPENSE_PLAN_CREDENTIAL_SELECT).not.toHaveProperty('login');
  });
});
