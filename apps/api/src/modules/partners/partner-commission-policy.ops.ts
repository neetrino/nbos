import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, type DealTypeEnum, type PrismaClient } from '@nbos/database';

export const PARTNER_COMMISSION_DEAL_TYPES: readonly DealTypeEnum[] = [
  'PRODUCT',
  'EXTENSION',
  'MAINTENANCE',
  'OUTSOURCE',
] as const;

const DEAL_TYPE_SET = new Set<string>(PARTNER_COMMISSION_DEAL_TYPES);

export interface CommissionPolicyRowInput {
  dealType: string;
  percent: number | null;
}

export function assertPartnerCommissionPercent(value: number): number {
  if (Number.isNaN(value) || value < 0 || value > 100) {
    throw new BadRequestException('percent must be a number from 0 to 100');
  }
  return value;
}

export function validateCommissionPolicyBody(rows: CommissionPolicyRowInput[]): void {
  if (rows.length !== PARTNER_COMMISSION_DEAL_TYPES.length) {
    throw new BadRequestException(
      `rows must contain exactly ${PARTNER_COMMISSION_DEAL_TYPES.length} entries (one per deal type)`,
    );
  }
  const seen = new Set<string>();
  for (const r of rows) {
    const dt = r.dealType?.trim().toUpperCase() ?? '';
    if (!DEAL_TYPE_SET.has(dt)) {
      throw new BadRequestException(`Invalid dealType: ${r.dealType}`);
    }
    if (seen.has(dt)) {
      throw new BadRequestException(`Duplicate dealType: ${dt}`);
    }
    seen.add(dt);
    if (r.percent !== null) {
      assertPartnerCommissionPercent(r.percent);
    }
  }
  for (const dt of PARTNER_COMMISSION_DEAL_TYPES) {
    if (!seen.has(dt)) {
      throw new BadRequestException(`Missing dealType: ${dt}`);
    }
  }
}

export interface PartnerCommissionPolicyViewDto {
  partnerId: string;
  fallbackPercent: string;
  rows: Array<{ dealType: DealTypeEnum; percent: string | null }>;
}

export async function loadPartnerCommissionPolicyView(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
): Promise<PartnerCommissionPolicyViewDto> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true, defaultPercent: true },
  });
  if (!partner) throw new NotFoundException(`Partner ${partnerId} not found`);

  const stored = await prisma.partnerCommissionPolicyRow.findMany({
    where: { partnerId },
  });
  const byType = new Map(stored.map((r) => [r.dealType, r.percent]));

  return {
    partnerId: partner.id,
    fallbackPercent: partner.defaultPercent.toFixed(2),
    rows: PARTNER_COMMISSION_DEAL_TYPES.map((dealType) => {
      const storedPercent = byType.get(dealType);
      return {
        dealType,
        percent: storedPercent != null ? storedPercent.toFixed(2) : null,
      };
    }),
  };
}

export async function applyPartnerCommissionPolicy(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
  rows: CommissionPolicyRowInput[],
): Promise<PartnerCommissionPolicyViewDto> {
  validateCommissionPolicyBody(rows);

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true },
  });
  if (!partner) throw new NotFoundException(`Partner ${partnerId} not found`);

  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      const dealType = r.dealType.trim().toUpperCase() as DealTypeEnum;
      if (r.percent === null) {
        await tx.partnerCommissionPolicyRow.deleteMany({
          where: { partnerId, dealType },
        });
      } else {
        await tx.partnerCommissionPolicyRow.upsert({
          where: { partnerId_dealType: { partnerId, dealType } },
          create: {
            partnerId,
            dealType,
            percent: new Decimal(r.percent),
          },
          update: { percent: new Decimal(r.percent) },
        });
      }
    }
  });

  return loadPartnerCommissionPolicyView(prisma, partnerId);
}
