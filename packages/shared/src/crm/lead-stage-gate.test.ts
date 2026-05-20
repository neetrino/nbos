import { describe, expect, it } from 'vitest';
import { getLeadStageGateErrors } from './lead-stage-gate';

const baseLead = {
  name: 'Website',
  contactName: 'Alex',
  phone: '+10000000000',
  email: null as string | null,
  assignedTo: 'seller-1',
  notes: 'Called twice',
  source: 'SALES' as string | null,
  sourceDetail: 'COLD_CALL' as string | null,
  sourcePartnerId: null as string | null,
  sourceContactId: null as string | null,
  marketingAccountId: null as string | null,
  marketingActivityId: null as string | null,
};

describe('getLeadStageGateErrors', () => {
  it('requires notes for SPAM', () => {
    expect(getLeadStageGateErrors({ ...baseLead, notes: null }, 'SPAM')).toHaveLength(1);
    expect(getLeadStageGateErrors({ ...baseLead, notes: 'Duplicate' }, 'SPAM')).toEqual([]);
  });

  it('requires seller and notes for DIDNT_GET_THROUGH', () => {
    const errors = getLeadStageGateErrors(
      { ...baseLead, assignedTo: null, notes: null },
      'DIDNT_GET_THROUGH',
    );
    expect(errors.map((e) => e.field)).toEqual(expect.arrayContaining(['assignedTo', 'notes']));
  });

  it('requires SQL conversion fields and attribution', () => {
    const errors = getLeadStageGateErrors({ ...baseLead, name: '', source: null }, 'SQL');
    expect(errors.map((e) => e.field)).toEqual(expect.arrayContaining(['name', 'source']));
  });
});
