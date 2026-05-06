import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Decimal,
  type DealTypeEnum,
  type PartnerReferralSourcePolicyEnum,
  type PaymentTypeEnum,
  type PrismaClient,
} from '@nbos/database';
import { assertPartnerCommissionPercent } from '../../partners/partner-commission-policy.ops';

const OVERRIDE_REASON_MIN_LEN = 3;

export type PatchPartnerReferralTermsBody =
  | { mode: 'RESET' }
  | { mode: 'OVERRIDE'; partnerPercent: number; overrideReason: string };

export type PartnerReferralTermsDealSnapshot = {
  source: string | null;
  sourcePartnerId: string | null;
  type: DealTypeEnum;
  paymentType: PaymentTypeEnum | null;
};

export async function resolveSuggestedPartnerReferralPercent(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
  dealType: DealTypeEnum,
): Promise<{ percent: Decimal; sourcePolicy: PartnerReferralSourcePolicyEnum }> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true, defaultPercent: true },
  });
  if (!partner) {
    throw new NotFoundException(`Partner ${partnerId} not found`);
  }

  const row = await prisma.partnerCommissionPolicyRow.findUnique({
    where: { partnerId_dealType: { partnerId, dealType } },
  });

  if (row) {
    return { percent: row.percent, sourcePolicy: 'POLICY' };
  }
  return { percent: partner.defaultPercent, sourcePolicy: 'DEFAULT' };
}

function assertPatchBody(body: unknown): asserts body is PatchPartnerReferralTermsBody {
  if (!body || typeof body !== 'object' || !('mode' in body)) {
    throw new BadRequestException('body must include mode');
  }
  const mode = (body as { mode?: string }).mode;
  if (mode === 'RESET') return;
  if (mode === 'OVERRIDE') {
    const b = body as { partnerPercent?: unknown; overrideReason?: unknown };
    if (typeof b.partnerPercent !== 'number') {
      throw new BadRequestException('partnerPercent is required for OVERRIDE');
    }
    if (typeof b.overrideReason !== 'string') {
      throw new BadRequestException('overrideReason is required for OVERRIDE');
    }
    return;
  }
  throw new BadRequestException('mode must be RESET or OVERRIDE');
}

/**
 * Keeps `PartnerReferralTerms` aligned with the deal when source is Partner.
 * Does not change `partnerPercent` when `sourcePolicy` is OVERRIDE (only snapshots).
 * Pass `snapshot` when the caller already loaded deal fields to avoid an extra read.
 */
export async function syncPartnerReferralTermsForDeal(
  prisma: InstanceType<typeof PrismaClient>,
  dealId: string,
  snapshot?: PartnerReferralTermsDealSnapshot,
): Promise<void> {
  const deal =
    snapshot ??
    (await prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        source: true,
        sourcePartnerId: true,
        type: true,
        paymentType: true,
      },
    }));
  if (!deal) return;

  if (deal.source !== 'PARTNER' || !deal.sourcePartnerId) {
    await prisma.partnerReferralTerms.deleteMany({ where: { dealId } });
    return;
  }

  const existing = await prisma.partnerReferralTerms.findUnique({
    where: { dealId },
  });

  if (existing?.sourcePolicy === 'OVERRIDE') {
    await prisma.partnerReferralTerms.update({
      where: { dealId },
      data: {
        partnerId: deal.sourcePartnerId,
        dealType: deal.type,
        paymentType: deal.paymentType,
      },
    });
    return;
  }

  const { percent, sourcePolicy } = await resolveSuggestedPartnerReferralPercent(
    prisma,
    deal.sourcePartnerId,
    deal.type,
  );

  await prisma.partnerReferralTerms.upsert({
    where: { dealId },
    create: {
      dealId,
      partnerId: deal.sourcePartnerId,
      dealType: deal.type,
      paymentType: deal.paymentType,
      partnerPercent: percent,
      sourcePolicy,
    },
    update: {
      partnerId: deal.sourcePartnerId,
      dealType: deal.type,
      paymentType: deal.paymentType,
      partnerPercent: percent,
      sourcePolicy,
      overrideReason: null,
    },
  });
}

export async function patchPartnerReferralTerms(
  prisma: InstanceType<typeof PrismaClient>,
  dealId: string,
  body: unknown,
): Promise<void> {
  assertPatchBody(body);

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      source: true,
      sourcePartnerId: true,
      type: true,
      paymentType: true,
    },
  });
  if (!deal) {
    throw new NotFoundException(`Deal ${dealId} not found`);
  }
  if (deal.source !== 'PARTNER' || !deal.sourcePartnerId) {
    throw new BadRequestException(
      'Partner referral terms apply only when source is Partner and a partner is set',
    );
  }

  if (body.mode === 'RESET') {
    const { percent, sourcePolicy } = await resolveSuggestedPartnerReferralPercent(
      prisma,
      deal.sourcePartnerId,
      deal.type,
    );
    await prisma.partnerReferralTerms.upsert({
      where: { dealId },
      create: {
        dealId,
        partnerId: deal.sourcePartnerId,
        dealType: deal.type,
        paymentType: deal.paymentType,
        partnerPercent: percent,
        sourcePolicy,
      },
      update: {
        partnerId: deal.sourcePartnerId,
        dealType: deal.type,
        paymentType: deal.paymentType,
        partnerPercent: percent,
        sourcePolicy,
        overrideReason: null,
      },
    });
    return;
  }

  const pct = assertPartnerCommissionPercent(body.partnerPercent);
  const reason = body.overrideReason.trim();
  if (reason.length < OVERRIDE_REASON_MIN_LEN) {
    throw new BadRequestException(
      `overrideReason must be at least ${OVERRIDE_REASON_MIN_LEN} characters`,
    );
  }

  await prisma.partnerReferralTerms.upsert({
    where: { dealId },
    create: {
      dealId,
      partnerId: deal.sourcePartnerId,
      dealType: deal.type,
      paymentType: deal.paymentType,
      partnerPercent: new Decimal(pct),
      sourcePolicy: 'OVERRIDE',
      overrideReason: reason,
    },
    update: {
      partnerId: deal.sourcePartnerId,
      dealType: deal.type,
      paymentType: deal.paymentType,
      partnerPercent: new Decimal(pct),
      sourcePolicy: 'OVERRIDE',
      overrideReason: reason,
    },
  });
}

export function dealNeedsPartnerReferralTerms(deal: {
  source: string | null;
  sourcePartnerId: string | null;
}): boolean {
  return deal.source === 'PARTNER' && Boolean(deal.sourcePartnerId);
}
