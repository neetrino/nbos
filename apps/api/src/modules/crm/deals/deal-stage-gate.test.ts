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

  it('requires productCategory + productType for PRODUCT at SEND_OFFER', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
    };
    expect(() => validateDealStageGate(deal, 'SEND_OFFER')).not.toThrow();
  });

  it('requires pmId + deadline for PRODUCT at DEPOSIT_AND_CONTRACT', () => {
    const deal = {
      ...baseDeal,
      amount: 5000,
      paymentType: 'CLASSIC',
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
    };
    expect(() => validateDealStageGate(deal, 'DEPOSIT_AND_CONTRACT')).toThrow(BadRequestException);

    const complete = { ...deal, pmId: 'pm-1', deadline: new Date() };
    expect(() => validateDealStageGate(complete, 'DEPOSIT_AND_CONTRACT')).not.toThrow();
  });

  it('requires existingProductId for EXTENSION at DEPOSIT_AND_CONTRACT', () => {
    const deal = {
      ...baseDeal,
      type: 'EXTENSION',
      amount: 1000,
      paymentType: 'CLASSIC',
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
      pmId: 'pm-1',
      deadline: new Date(),
    };
    expect(() => validateDealStageGate(complete, 'WON')).not.toThrow();
  });
});
