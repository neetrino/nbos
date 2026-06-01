import { describe, it, expect } from 'vitest';
import { getDealStageGateErrors } from './deal-stage-gate';

const baseDeal = {
  contactId: 'contact-1',
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
  it('returns no errors for START_CONVERSATION draft', () => {
    expect(
      getDealStageGateErrors(
        {
          ...baseDeal,
          contactId: null,
          type: null,
          taxStatus: null,
        },
        'START_CONVERSATION',
      ),
    ).toEqual([]);
  });

  it('requires contact, type and tax at DISCUSS_NEEDS', () => {
    const errors = getDealStageGateErrors(
      { ...baseDeal, contactId: null, type: null, taxStatus: null },
      'DISCUSS_NEEDS',
    );
    expect(errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['contactId', 'type', 'taxStatus']),
    );
    expect(getDealStageGateErrors(baseDeal, 'DISCUSS_NEEDS')).toEqual([]);
  });

  it('requires notes for FAILED', () => {
    expect(getDealStageGateErrors(baseDeal, 'FAILED')).toHaveLength(1);
    expect(getDealStageGateErrors({ ...baseDeal, notes: 'Budget' }, 'FAILED')).toEqual([]);
  });

  it('accepts DEPOSIT_AND_CONTRACT without PM for PRODUCT', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      offerLink: 'https://example.com/offer',
      companyId: 'company-1',
      deadline: new Date(),
    };
    expect(getDealStageGateErrors(deal, 'DEPOSIT_AND_CONTRACT')).toEqual([]);
  });

  it('requires PM before WON for PRODUCT', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      offerLink: 'https://example.com/offer',
      companyId: 'company-1',
      deadline: new Date(),
      orders: [{ invoices: [{ id: 'invoice-1' }] }],
    };
    expect(getDealStageGateErrors(deal, 'WON').map((error) => error.field)).toContain('pmId');
    expect(
      getDealStageGateErrors({ ...deal, pmId: 'pm-1' }, 'WON').map((error) => error.field),
    ).not.toContain('pmId');
  });

  it('requires deposit invoice before WON for commercial deals', () => {
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
    };
    expect(getDealStageGateErrors(deal, 'WON').map((error) => error.field)).toContain('invoice');
    expect(
      getDealStageGateErrors({ ...deal, orders: [{ invoices: [{ id: 'invoice-1' }] }] }, 'WON'),
    ).toEqual([]);
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
