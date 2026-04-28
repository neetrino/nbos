import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { validateDealStageGate } from './deal-stage-gate';

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
  offerSentAt: null as Date | null,
  offerLink: null as string | null,
  offerFileUrl: null as string | null,
  offerScreenshotUrl: null as string | null,
  responseDueAt: null as Date | null,
  contractSignedAt: null as Date | null,
  contractFileUrl: null as string | null,
  orders: [] as Array<{ invoices: unknown[] }>,
  source: 'SALES' as string | null,
  sourceDetail: 'COLD_CALL' as string | null,
  sourcePartnerId: null as string | null,
  sourceContactId: null as string | null,
  marketingAccountId: null as string | null,
  marketingActivityId: null as string | null,
};

describe('validateDealStageGate', () => {
  it('allows early stages without validation', () => {
    expect(() => validateDealStageGate(baseDeal, 'DISCUSS_NEEDS')).not.toThrow();
    expect(() => validateDealStageGate(baseDeal, 'MEETING')).not.toThrow();
    expect(() => validateDealStageGate(baseDeal, 'CAN_WE_DO_IT')).not.toThrow();
  });

  it('always allows FAILED', () => {
    expect(() => validateDealStageGate(baseDeal, 'FAILED')).not.toThrow();
  });

  it('requires attribution before meaningful deal movement', () => {
    const deal = { ...baseDeal, sourceDetail: null };
    expect(() => validateDealStageGate(deal, 'DISCUSS_NEEDS')).toThrow(BadRequestException);
  });

  it('requires amount and paymentType at SEND_OFFER', () => {
    expect(() => validateDealStageGate(baseDeal, 'SEND_OFFER')).toThrow(BadRequestException);

    const withFinance = { ...baseDeal, amount: 5000, paymentType: 'CLASSIC' };
    expect(() => validateDealStageGate(withFinance, 'SEND_OFFER')).toThrow(BadRequestException);
  });

  it('requires productCategory, productType, sent date, and proof for PRODUCT at SEND_OFFER', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      offerSentAt: new Date(),
      offerLink: 'https://example.com/offer',
    };
    expect(() => validateDealStageGate(deal, 'SEND_OFFER')).not.toThrow();
  });

  it('requires offer proof at SEND_OFFER', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      offerSentAt: new Date(),
    };
    expect(() => validateDealStageGate(deal, 'SEND_OFFER')).toThrow(BadRequestException);
  });

  it('requires response deadline at GET_ANSWER', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      offerSentAt: new Date(),
      offerFileUrl: 'https://example.com/offer.pdf',
    };
    expect(() => validateDealStageGate(deal, 'GET_ANSWER')).toThrow(BadRequestException);
  });

  it('requires pmId + deadline for PRODUCT at DEPOSIT_AND_CONTRACT', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      offerSentAt: new Date(),
      offerLink: 'https://example.com/offer',
      responseDueAt: new Date(),
    };
    expect(() => validateDealStageGate(deal, 'DEPOSIT_AND_CONTRACT')).toThrow(BadRequestException);

    const complete = {
      ...deal,
      companyId: 'company-1',
      pmId: 'pm-1',
      deadline: new Date(),
      contractSignedAt: new Date(),
      orders: [{ invoices: [{ id: 'invoice-1' }] }],
    };
    expect(() => validateDealStageGate(complete, 'DEPOSIT_AND_CONTRACT')).not.toThrow();
  });

  it('requires contract proof and invoice for deposit-based deals', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      offerSentAt: new Date(),
      offerLink: 'https://example.com/offer',
      responseDueAt: new Date(),
      companyId: 'company-1',
      pmId: 'pm-1',
      deadline: new Date(),
    };
    expect(() => validateDealStageGate(deal, 'DEPOSIT_AND_CONTRACT')).toThrow(BadRequestException);
  });

  it('requires existingProductId for EXTENSION at DEPOSIT_AND_CONTRACT', () => {
    const deal = {
      ...baseDeal,
      type: 'EXTENSION',
      amount: 1000,
      paymentType: 'CLASSIC',
      taxStatus: 'TAX_FREE',
      offerSentAt: new Date(),
      offerLink: 'https://example.com/offer',
      responseDueAt: new Date(),
      contractFileUrl: 'https://example.com/contract.pdf',
      orders: [{ invoices: [{ id: 'invoice-1' }] }],
    };
    expect(() => validateDealStageGate(deal, 'DEPOSIT_AND_CONTRACT')).toThrow(BadRequestException);

    const withProduct = { ...deal, existingProductId: 'prod-1' };
    expect(() => validateDealStageGate(withProduct, 'DEPOSIT_AND_CONTRACT')).not.toThrow();
  });

  it('MAINTENANCE does not require productCategory at SEND_OFFER', () => {
    const deal = {
      ...baseDeal,
      type: 'MAINTENANCE',
      amount: 500,
      paymentType: 'MONTHLY',
      offerSentAt: new Date(),
      offerScreenshotUrl: 'https://example.com/screenshot.png',
    };
    expect(() => validateDealStageGate(deal, 'SEND_OFFER')).not.toThrow();
  });

  it('WON checks all gates cumulatively', () => {
    const complete = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      companyId: 'company-1',
      pmId: 'pm-1',
      deadline: new Date(),
      offerSentAt: new Date(),
      offerLink: 'https://example.com/offer',
      responseDueAt: new Date(),
      contractSignedAt: new Date(),
      orders: [{ invoices: [{ id: 'invoice-1' }] }],
    };
    expect(() => validateDealStageGate(complete, 'WON')).not.toThrow();
  });
});
