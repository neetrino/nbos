import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import { deriveBonusPoolFundingMetrics } from './bonus-pool-funding-health';

describe('deriveBonusPoolFundingMetrics', () => {
  it('returns OVER when over funding is positive', () => {
    const m = deriveBonusPoolFundingMetrics({
      planned: new Decimal(100),
      received: new Decimal(120),
      available: new Decimal(0),
      remaining: new Decimal(0),
      overFunding: new Decimal(20),
      ledgerStatus: 'ACTIVE',
    });
    expect(m.fundingHealth).toBe('OVER');
  });

  it('returns READY when funding can cover remaining bonuses', () => {
    const m = deriveBonusPoolFundingMetrics({
      planned: new Decimal(100),
      received: new Decimal(100),
      available: new Decimal(50),
      remaining: new Decimal(40),
      overFunding: new Decimal(0),
      ledgerStatus: 'ACTIVE',
    });
    expect(m.fundingHealth).toBe('READY');
    expect(m.fundingFillPercent).toBe(100);
  });

  it('returns EMPTY when no client money received', () => {
    const m = deriveBonusPoolFundingMetrics({
      planned: new Decimal(200),
      received: new Decimal(0),
      available: new Decimal(0),
      remaining: new Decimal(200),
      overFunding: new Decimal(0),
      ledgerStatus: 'ACTIVE',
    });
    expect(m.fundingHealth).toBe('EMPTY');
    expect(m.fundingFillPercent).toBe(0);
  });

  it('caps fill at 100% when received exceeds planned bonus pool', () => {
    const m = deriveBonusPoolFundingMetrics({
      planned: new Decimal(125_000),
      received: new Decimal(2_500_000),
      available: new Decimal(2_437_500),
      remaining: new Decimal(62_500),
      overFunding: new Decimal(0),
      ledgerStatus: 'PARTIALLY_RELEASED',
    });
    expect(m.fundingFillPercent).toBe(100);
    expect(m.fundingHealth).toBe('READY');
  });
});
