import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { validateLeadStageGate } from './lead-stage-gate';

const baseLead = {
  contactName: 'Jane Doe',
  phone: '+37400000000',
  email: null as string | null,
  assignedTo: null as string | null,
  notes: null as string | null,
  source: 'SALES' as string | null,
  sourceDetail: 'COLD_CALL' as string | null,
  sourcePartnerId: null as string | null,
  sourceContactId: null as string | null,
  marketingAccountId: null as string | null,
  marketingActivityId: null as string | null,
};

describe('validateLeadStageGate', () => {
  it('allows NEW without seller or notes', () => {
    expect(() => validateLeadStageGate(baseLead, 'NEW')).not.toThrow();
  });

  it('requires contact name and phone or email for ON_HOLD', () => {
    expect(() =>
      validateLeadStageGate(
        { ...baseLead, contactName: '  ', phone: null, email: null },
        'ON_HOLD',
      ),
    ).toThrow(BadRequestException);
  });

  it('requires seller and notes from DIDNT_GET_THROUGH', () => {
    expect(() => validateLeadStageGate(baseLead, 'DIDNT_GET_THROUGH')).toThrow(BadRequestException);

    const ready = {
      ...baseLead,
      assignedTo: 'emp-1',
      notes: 'Left voicemail',
    };
    expect(() => validateLeadStageGate(ready, 'DIDNT_GET_THROUGH')).not.toThrow();
  });

  it('requires attribution from DIDNT_GET_THROUGH', () => {
    const lead = {
      ...baseLead,
      assignedTo: 'emp-1',
      notes: 'Called twice',
      sourceDetail: null,
    };
    expect(() => validateLeadStageGate(lead, 'DIDNT_GET_THROUGH')).toThrow(BadRequestException);
  });

  it('requires notes from CONTACT_ESTABLISHED', () => {
    const lead = {
      ...baseLead,
      assignedTo: 'emp-1',
      notes: 'Qualified interest',
    };
    expect(() => validateLeadStageGate(lead, 'CONTACT_ESTABLISHED')).not.toThrow();

    expect(() => validateLeadStageGate({ ...lead, notes: null }, 'CONTACT_ESTABLISHED')).toThrow(
      BadRequestException,
    );
  });

  it('requires spam reason when moving to SPAM', () => {
    expect(() => validateLeadStageGate(baseLead, 'SPAM')).toThrow(BadRequestException);
    expect(() =>
      validateLeadStageGate({ ...baseLead, notes: 'Duplicate form' }, 'SPAM'),
    ).not.toThrow();
  });
});
