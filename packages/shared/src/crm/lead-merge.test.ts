import { describe, expect, it } from 'vitest';
import {
  canAttachLeadToContact,
  canMergeLeads,
  canOfferLeadAttach,
  canOfferLeadMerge,
  defaultLeadMergeStatus,
  isAllowedLeadMergeStatusOverride,
} from './lead-merge';

describe('canMergeLeads', () => {
  it('allows Head of Sales and CEO on any pair', () => {
    expect(
      canMergeLeads({
        roleSlug: 'head-sales',
        actorId: 's1',
        survivorAssignedTo: 'other',
        absorbedAssignedTo: 'else',
      }),
    ).toBe(true);
    expect(
      canMergeLeads({
        roleSlug: 'owner',
        actorId: 'o1',
        survivorAssignedTo: 'other',
        absorbedAssignedTo: 'else',
      }),
    ).toBe(false);
    expect(
      canMergeLeads({
        roleSlug: 'pm',
        actorId: 'o1',
        survivorAssignedTo: 'other',
        absorbedAssignedTo: 'else',
        isPlatformOwner: true,
      }),
    ).toBe(true);
    expect(canOfferLeadMerge('owner')).toBe(false);
    expect(canOfferLeadMerge('pm', true)).toBe(true);
  });

  it('allows Seller only when both Leads are assigned to them', () => {
    expect(
      canMergeLeads({
        roleSlug: 'seller',
        actorId: 's1',
        survivorAssignedTo: 's1',
        absorbedAssignedTo: 's1',
      }),
    ).toBe(true);
    expect(
      canMergeLeads({
        roleSlug: 'seller',
        actorId: 's1',
        survivorAssignedTo: 's1',
        absorbedAssignedTo: 's2',
      }),
    ).toBe(false);
    expect(
      canMergeLeads({
        roleSlug: 'seller',
        actorId: 's1',
        survivorAssignedTo: 's1',
        absorbedAssignedTo: null,
      }),
    ).toBe(false);
  });

  it('blocks Marketing', () => {
    expect(
      canMergeLeads({
        roleSlug: 'marketing',
        actorId: 'm1',
        survivorAssignedTo: 'm1',
        absorbedAssignedTo: 'm1',
      }),
    ).toBe(false);
    expect(canOfferLeadMerge('head-marketing')).toBe(false);
  });
});

describe('canAttachLeadToContact', () => {
  it('allows Seller only on their assigned Lead', () => {
    expect(canAttachLeadToContact({ roleSlug: 'seller', actorId: 's1', assignedTo: 's1' })).toBe(
      true,
    );
    expect(canAttachLeadToContact({ roleSlug: 'seller', actorId: 's1', assignedTo: 's2' })).toBe(
      false,
    );
    expect(canAttachLeadToContact({ roleSlug: 'seller', actorId: 's1', assignedTo: null })).toBe(
      false,
    );
  });

  it('allows Head of Sales on any Lead and blocks Marketing', () => {
    expect(
      canAttachLeadToContact({ roleSlug: 'head-sales', actorId: 'h1', assignedTo: 'other' }),
    ).toBe(true);
    expect(canAttachLeadToContact({ roleSlug: 'marketing', actorId: 'm1', assignedTo: 'm1' })).toBe(
      false,
    );
    expect(canOfferLeadAttach('marketing')).toBe(false);
    expect(canOfferLeadAttach('seller')).toBe(true);
  });
});

describe('defaultLeadMergeStatus', () => {
  it('picks the more advanced active stage', () => {
    expect(defaultLeadMergeStatus('NEW', 'MQL')).toBe('MQL');
    expect(defaultLeadMergeStatus('MQL', 'NEW')).toBe('MQL');
  });

  it('does not treat On Hold as more advanced than an active stage', () => {
    expect(defaultLeadMergeStatus('ON_HOLD', 'NEW')).toBe('NEW');
    expect(defaultLeadMergeStatus('MQL', 'ON_HOLD')).toBe('MQL');
  });

  it('does not default to Spam', () => {
    expect(defaultLeadMergeStatus('SPAM', 'NEW')).toBe('NEW');
    expect(defaultLeadMergeStatus('NEW', 'SPAM')).toBe('NEW');
    expect(defaultLeadMergeStatus('SPAM', 'SPAM')).toBe('NEW');
  });

  it('keeps On Hold when both are On Hold', () => {
    expect(defaultLeadMergeStatus('ON_HOLD', 'ON_HOLD')).toBe('ON_HOLD');
  });

  it('allows only active + On Hold as status override', () => {
    expect(isAllowedLeadMergeStatusOverride('MQL')).toBe(true);
    expect(isAllowedLeadMergeStatusOverride('SPAM')).toBe(false);
    expect(isAllowedLeadMergeStatusOverride('SQL')).toBe(false);
  });
});
