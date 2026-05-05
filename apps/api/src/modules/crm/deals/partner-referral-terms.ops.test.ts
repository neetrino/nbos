import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import {
  patchPartnerReferralTerms,
  resolveSuggestedPartnerReferralPercent,
  syncPartnerReferralTermsForDeal,
} from './partner-referral-terms.ops';

describe('partner-referral-terms.ops', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  describe('resolveSuggestedPartnerReferralPercent', () => {
    it('returns POLICY row percent when present', async () => {
      prisma.partner.findUnique.mockResolvedValue({
        id: 'p-1',
        defaultPercent: new Decimal(25),
      });
      prisma.partnerCommissionPolicyRow.findUnique.mockResolvedValue({
        percent: new Decimal(12.5),
      });

      const r = await resolveSuggestedPartnerReferralPercent(prisma as never, 'p-1', 'PRODUCT');

      expect(r.sourcePolicy).toBe('POLICY');
      expect(r.percent.toFixed(2)).toBe('12.50');
    });

    it('falls back to partner default when no policy row', async () => {
      prisma.partner.findUnique.mockResolvedValue({
        id: 'p-1',
        defaultPercent: new Decimal(30),
      });
      prisma.partnerCommissionPolicyRow.findUnique.mockResolvedValue(null);

      const r = await resolveSuggestedPartnerReferralPercent(prisma as never, 'p-1', 'OUTSOURCE');

      expect(r.sourcePolicy).toBe('DEFAULT');
      expect(r.percent.toFixed(2)).toBe('30.00');
    });

    it('throws when partner missing', async () => {
      prisma.partner.findUnique.mockResolvedValue(null);

      await expect(
        resolveSuggestedPartnerReferralPercent(prisma as never, 'missing', 'PRODUCT'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('syncPartnerReferralTermsForDeal', () => {
    it('deletes terms when source is not PARTNER', async () => {
      await syncPartnerReferralTermsForDeal(prisma as never, 'd-1', {
        source: 'SALES',
        sourcePartnerId: null,
        type: 'PRODUCT',
        paymentType: 'CLASSIC',
      });

      expect(prisma.partnerReferralTerms.deleteMany).toHaveBeenCalledWith({
        where: { dealId: 'd-1' },
      });
    });

    it('upserts suggested percent when PARTNER with partner', async () => {
      prisma.partnerReferralTerms.findUnique.mockResolvedValue(null);
      prisma.partner.findUnique.mockResolvedValue({
        id: 'p-1',
        defaultPercent: new Decimal(30),
      });
      prisma.partnerCommissionPolicyRow.findUnique.mockResolvedValue(null);

      await syncPartnerReferralTermsForDeal(prisma as never, 'd-1', {
        source: 'PARTNER',
        sourcePartnerId: 'p-1',
        type: 'EXTENSION',
        paymentType: 'SUBSCRIPTION',
      });

      expect(prisma.partnerReferralTerms.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { dealId: 'd-1' },
          create: expect.objectContaining({
            sourcePolicy: 'DEFAULT',
            partnerId: 'p-1',
            dealType: 'EXTENSION',
            paymentType: 'SUBSCRIPTION',
          }),
        }),
      );
    });

    it('updates snapshots only when OVERRIDE', async () => {
      prisma.partnerReferralTerms.findUnique.mockResolvedValue({
        dealId: 'd-1',
        sourcePolicy: 'OVERRIDE',
        partnerPercent: new Decimal(40),
      });

      await syncPartnerReferralTermsForDeal(prisma as never, 'd-1', {
        source: 'PARTNER',
        sourcePartnerId: 'p-2',
        type: 'MAINTENANCE',
        paymentType: 'CLASSIC',
      });

      expect(prisma.partnerReferralTerms.update).toHaveBeenCalledWith({
        where: { dealId: 'd-1' },
        data: {
          partnerId: 'p-2',
          dealType: 'MAINTENANCE',
          paymentType: 'CLASSIC',
        },
      });
      expect(prisma.partnerReferralTerms.upsert).not.toHaveBeenCalled();
    });
  });

  describe('patchPartnerReferralTerms', () => {
    it('rejects when deal is not partner-sourced', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'd-1',
        source: 'SALES',
        sourcePartnerId: null,
        type: 'PRODUCT',
        paymentType: 'CLASSIC',
      });

      await expect(
        patchPartnerReferralTerms(prisma as never, 'd-1', { mode: 'RESET' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('RESET recalculates from policy', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'd-1',
        source: 'PARTNER',
        sourcePartnerId: 'p-1',
        type: 'PRODUCT',
        paymentType: 'CLASSIC',
      });
      prisma.partner.findUnique.mockResolvedValue({
        id: 'p-1',
        defaultPercent: new Decimal(30),
      });
      prisma.partnerCommissionPolicyRow.findUnique.mockResolvedValue({
        percent: new Decimal(15),
      });

      await patchPartnerReferralTerms(prisma as never, 'd-1', { mode: 'RESET' });

      expect(prisma.partnerReferralTerms.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            sourcePolicy: 'POLICY',
            overrideReason: null,
          }),
        }),
      );
    });

    it('OVERRIDE requires reason length', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'd-1',
        source: 'PARTNER',
        sourcePartnerId: 'p-1',
        type: 'PRODUCT',
        paymentType: 'CLASSIC',
      });

      await expect(
        patchPartnerReferralTerms(prisma as never, 'd-1', {
          mode: 'OVERRIDE',
          partnerPercent: 10,
          overrideReason: 'ab',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
