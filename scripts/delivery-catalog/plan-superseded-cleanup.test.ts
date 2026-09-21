import { describe, expect, it } from 'vitest';
import {
  formatCleanupPlan,
  planSupersededCleanup,
  SUPERSEDED_FUNCTION_CODES,
} from './plan-superseded-cleanup';

const DRAFT = {
  id: 'fn-1',
  code: 'CNT_MULTILINGUAL_SITE',
  status: 'DRAFT',
  featureCount: 0,
  publishedPriceCount: 0,
};

describe('planSupersededCleanup', () => {
  it('removes a card that is still nothing but a draft proposal', () => {
    expect(planSupersededCleanup([DRAFT])).toEqual([{ action: 'DELETE', candidate: DRAFT }]);
  });

  it('keeps a card that was activated', () => {
    const [verdict] = planSupersededCleanup([{ ...DRAFT, status: 'ACTIVE' }]);
    expect(verdict).toMatchObject({ action: 'KEEP', reason: 'status is ACTIVE, not a draft' });
  });

  it('keeps a card that a product already selected', () => {
    const [verdict] = planSupersededCleanup([{ ...DRAFT, featureCount: 2 }]);
    expect(verdict).toMatchObject({ action: 'KEEP' });
    expect(verdict?.action === 'KEEP' && verdict.reason).toContain('2 product configuration');
  });

  it('keeps a card whose units were published', () => {
    const [verdict] = planSupersededCleanup([{ ...DRAFT, publishedPriceCount: 1 }]);
    expect(verdict).toMatchObject({ action: 'KEEP', reason: 'has a published unit version' });
  });

  it('marks a dry run in the printed plan', () => {
    expect(formatCleanupPlan(planSupersededCleanup([DRAFT]), false)).toContain('Dry run');
  });

  it('lists only the cards a tiered card replaced', () => {
    expect(SUPERSEDED_FUNCTION_CODES).toHaveLength(6);
    expect(new Set(SUPERSEDED_FUNCTION_CODES).size).toBe(SUPERSEDED_FUNCTION_CODES.length);
  });
});
