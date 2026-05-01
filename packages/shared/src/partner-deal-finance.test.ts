import { describe, expect, it } from 'vitest';
import { BONUS_PERCENTAGES } from './constants';
import { computePartnerDealFinancePreview } from './partner-deal-finance';

describe('computePartnerDealFinancePreview', () => {
  it('uses partner defaultPercent when deal is from partner', () => {
    const r = computePartnerDealFinancePreview({
      amount: 1000,
      paymentType: 'CLASSIC',
      dealSource: 'PARTNER',
      partnerDefaultPercent: 25,
    });
    expect(r.total).toBe(1000);
    expect(r.commissionPercentUsed).toBe(25);
    expect(r.partnerAmount).toBe(250);
    expect(r.revenue).toBe(750);
    expect(r.isFromPartner).toBe(true);
  });

  it('falls back to PARTNER_DEFAULT when percent missing or invalid', () => {
    const d = BONUS_PERCENTAGES.PARTNER_DEFAULT;
    expect(
      computePartnerDealFinancePreview({
        amount: 100,
        paymentType: 'CLASSIC',
        dealSource: 'PARTNER',
      }).commissionPercentUsed,
    ).toBe(d);
    expect(
      computePartnerDealFinancePreview({
        amount: 100,
        paymentType: 'CLASSIC',
        dealSource: 'PARTNER',
        partnerDefaultPercent: 'bad',
      }).commissionPercentUsed,
    ).toBe(d);
    expect(
      computePartnerDealFinancePreview({
        amount: 100,
        paymentType: 'CLASSIC',
        dealSource: 'PARTNER',
        partnerDefaultPercent: 150,
      }).commissionPercentUsed,
    ).toBe(d);
  });

  it('has no partner share when source is not PARTNER', () => {
    const r = computePartnerDealFinancePreview({
      amount: 500,
      paymentType: 'CLASSIC',
      dealSource: 'DIRECT',
      partnerDefaultPercent: 40,
    });
    expect(r.partnerAmount).toBe(0);
    expect(r.commissionPercentUsed).toBe(0);
    expect(r.revenue).toBe(500);
    expect(r.isFromPartner).toBe(false);
  });

  it('applies subscription annual total with partner on base amount', () => {
    const r = computePartnerDealFinancePreview({
      amount: 100,
      paymentType: 'SUBSCRIPTION',
      dealSource: 'PARTNER',
      partnerDefaultPercent: 30,
    });
    expect(r.total).toBe(1200);
    expect(r.partnerAmount).toBe(30);
    expect(r.revenue).toBe(1170);
  });
});
