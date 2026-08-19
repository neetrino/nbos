import { describe, expect, it } from 'vitest';
import { buildLeadSearchOr } from '../crm/leads/lead-search.where';
import { buildExpenseSearchAnd } from '../expenses/expense-search.where';

describe('global search where clauses', () => {
  it('lead search OR only targets safe text metadata fields', () => {
    const or = buildLeadSearchOr('sipan');
    expect(or).toHaveLength(4);
    const serialized = JSON.stringify(or);
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('secret');
    expect(serialized).toContain('contactName');
  });

  it('expense search OR avoids secret-like field names', () => {
    const clause = buildExpenseSearchAnd('hosting');
    const serialized = JSON.stringify(clause);
    expect(serialized).toContain('name');
    expect(serialized).not.toContain('secretValue');
  });
});
