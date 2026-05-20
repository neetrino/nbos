import { describe, it, expect } from 'vitest';
import { getDealStageGateErrors } from './deal-stage-gate';

const baseDeal = {
  type: 'PRODUCT',
  amount: null as unknown,
  paymentType: null as string | null,
  productCategory: null as string | null,
  productType: null as string | null,
  pmId: null as string | null,
  deadline: null as Date | null,
  existingProductId: null as string | null,
  companyId: null as string | null,
  taxStatus: 'TAX' as string | null,
  offerLink: null as string | null,
  offerFileUrl: null as string | null,
  offerScreenshotUrl: null as string | null,
  contractFileUrl: null as string | null,
  orders: [] as Array<{ invoices: unknown[] }>,
  source: 'SALES' as string | null,
  sourceDetail: 'COLD_CALL' as string | null,
  sourcePartnerId: null as string | null,
  sourceContactId: null as string | null,
  marketingAccountId: null as string | null,
  marketingActivityId: null as string | null,
};

describe('getDealStageGateErrors', () => {
  it('returns no errors for early stages', () => {
    expect(getDealStageGateErrors(baseDeal, 'DISCUSS_NEEDS')).toEqual([]);
  });

  it('requires notes for FAILED', () => {
    expect(getDealStageGateErrors(baseDeal, 'FAILED')).toHaveLength(1);
    expect(getDealStageGateErrors({ ...baseDeal, notes: 'Budget' }, 'FAILED')).toEqual([]);
  });

  it('accepts linked Drive contract files at DEPOSIT_AND_CONTRACT', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      offerLink: 'https://example.com/offer',
      companyId: 'company-1',
      pmId: 'pm-1',
      deadline: new Date(),
      linkedContractAssetCount: 1,
      orders: [{ invoices: [{ id: 'invoice-1' }] }],
    };
    expect(getDealStageGateErrors(deal, 'DEPOSIT_AND_CONTRACT')).toEqual([]);
  });

  it('accepts linked Drive offer files at SEND_OFFER', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      linkedOfferAssetCount: 1,
    };
    expect(getDealStageGateErrors(deal, 'SEND_OFFER')).toEqual([]);
  });
});
