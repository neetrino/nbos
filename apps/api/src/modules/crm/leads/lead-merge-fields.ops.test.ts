import { describe, expect, it } from 'vitest';
import {
  appendMergedNotes,
  resolveLeadMergeFields,
  type LeadMergeFieldSource,
} from './lead-merge-fields.ops';

function lead(overrides: Partial<LeadMergeFieldSource>): LeadMergeFieldSource {
  return {
    id: 'a',
    code: 'L-2026-0001',
    createdAt: new Date('2026-01-10'),
    name: 'Site',
    contactName: 'Anna',
    phone: null,
    email: null,
    assignedTo: 's1',
    notes: 'First note',
    source: 'MARKETING',
    sourceDetail: 'SMM',
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: 'acc-ig',
    marketingActivityId: null,
    status: 'NEW',
    ...overrides,
  };
}

describe('resolveLeadMergeFields', () => {
  it('honors explicit field choices', () => {
    const survivor = lead({ phone: '+374111', contactName: 'Anna' });
    const absorbed = lead({
      id: 'b',
      code: 'L-2026-0002',
      phone: '+374222',
      contactName: 'Boris',
      createdAt: new Date('2026-02-01'),
    });
    const resolved = resolveLeadMergeFields(survivor, absorbed, {
      phone: 'absorbed',
      contactName: 'survivor',
    });
    expect(resolved.phone).toBe('+374222');
    expect(resolved.contactName).toBe('Anna');
  });

  it('fills empty survivor fields from absorbed', () => {
    const survivor = lead({ phone: null, email: null });
    const absorbed = lead({
      id: 'b',
      code: 'L-2026-0002',
      phone: '+374222',
      email: 'b@example.com',
      createdAt: new Date('2026-02-01'),
    });
    const resolved = resolveLeadMergeFields(survivor, absorbed, {});
    expect(resolved.phone).toBe('+374222');
    expect(resolved.email).toBe('b@example.com');
  });

  it('keeps first-touch marketing when both sides have From/Where', () => {
    const survivor = lead({
      createdAt: new Date('2026-03-01'),
      source: 'SALES',
      sourceDetail: 'COLD_CALL',
      marketingAccountId: null,
    });
    const absorbed = lead({
      id: 'b',
      code: 'L-2026-0002',
      createdAt: new Date('2026-01-01'),
      source: 'MARKETING',
      sourceDetail: 'SMM',
      marketingAccountId: 'acc-ig',
    });
    const resolved = resolveLeadMergeFields(survivor, absorbed, {});
    expect(resolved.source).toBe('MARKETING');
    expect(resolved.sourceDetail).toBe('SMM');
    expect(resolved.marketingAccountId).toBe('acc-ig');
    expect(resolved.firstTouchLeadId).toBe('b');
    expect(resolved.otherSourceNote).toContain('Additional channel');
    expect(resolved.otherSourceNote).toContain('COLD_CALL');
  });

  it('defaults stage to the more advanced active status', () => {
    const resolved = resolveLeadMergeFields(
      lead({ status: 'NEW' }),
      lead({ id: 'b', code: 'L-2', status: 'MQL', createdAt: new Date('2026-02-01') }),
      {},
    );
    expect(resolved.status).toBe('MQL');
  });
});

describe('appendMergedNotes', () => {
  it('appends absorbed notes and the extra-channel line', () => {
    const notes = appendMergedNotes('Keep', 'Call log', 'L-2026-0002', 'Additional channel: SALES');
    expect(notes).toContain('Keep');
    expect(notes).toContain('Merged from L-2026-0002');
    expect(notes).toContain('Call log');
    expect(notes).toContain('Additional channel: SALES');
  });
});
