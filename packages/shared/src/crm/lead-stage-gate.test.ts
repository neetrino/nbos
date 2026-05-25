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

  it('allows ON_HOLD without any required fields', () => {
    const errors = getLeadStageGateErrors(
      {
        ...baseLead,
        contactName: '',
        phone: null,
        email: null,
        assignedTo: null,
        source: null,
        sourceDetail: null,
      },
      'ON_HOLD',
    );
    expect(errors).toEqual([]);
  });

  it('requires seller for DIDNT_GET_THROUGH but not notes', () => {
    const errors = getLeadStageGateErrors(
      { ...baseLead, assignedTo: null, notes: null },
      'DIDNT_GET_THROUGH',
    );
    expect(errors.map((e) => e.field)).toContain('assignedTo');
    expect(errors.map((e) => e.field)).not.toContain('notes');
  });

  it('does not require notes for CONTACT_ESTABLISHED', () => {
    const errors = getLeadStageGateErrors({ ...baseLead, notes: null }, 'CONTACT_ESTABLISHED');
    expect(errors.map((e) => e.field)).not.toContain('notes');
  });

  it('requires SQL conversion fields and attribution', () => {
    const errors = getLeadStageGateErrors({ ...baseLead, name: '', source: null }, 'SQL');
    expect(errors.map((e) => e.field)).toEqual(expect.arrayContaining(['name', 'source']));
  });
});
