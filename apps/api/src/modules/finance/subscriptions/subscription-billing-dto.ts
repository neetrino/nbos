import { BadRequestException } from '@nestjs/common';
import type { Prisma, SubscriptionBillingFrequencyEnum } from '@nbos/database';

const BILLING_FREQUENCIES: SubscriptionBillingFrequencyEnum[] = ['MONTHLY', 'YEARLY', 'CUSTOM'];

export interface ResolvedSubscriptionBillingInput {
  baseMonthlyAmount: number;
  billingStartDate: Date;
  billingFrequency: SubscriptionBillingFrequencyEnum;
  notificationsEnabled: boolean;
}

export function parseBillingFrequency(raw: string | undefined): SubscriptionBillingFrequencyEnum {
  if (!raw) return 'MONTHLY';
  const upper = raw.toUpperCase();
  if (BILLING_FREQUENCIES.includes(upper as SubscriptionBillingFrequencyEnum)) {
    return upper as SubscriptionBillingFrequencyEnum;
  }
  throw new BadRequestException(`Unknown billingFrequency: ${raw}`);
}

export function resolveSubscriptionBillingInput(data: {
  baseMonthlyAmount?: number;
  amount?: number;
  billingStartDate?: string;
  startDate?: string;
  billingFrequency?: string;
  notificationsEnabled?: boolean;
}): ResolvedSubscriptionBillingInput {
  const baseRaw = data.baseMonthlyAmount ?? data.amount;
  if (baseRaw === undefined || !Number.isFinite(baseRaw) || baseRaw <= 0) {
    throw new BadRequestException('baseMonthlyAmount must be greater than zero');
  }

  const startRaw = data.billingStartDate ?? data.startDate;
  if (!startRaw?.trim()) {
    throw new BadRequestException('billingStartDate is required');
  }

  const billingStartDate = new Date(startRaw);
  if (Number.isNaN(billingStartDate.getTime())) {
    throw new BadRequestException('billingStartDate is invalid');
  }

  return {
    baseMonthlyAmount: baseRaw,
    billingStartDate,
    billingFrequency: parseBillingFrequency(data.billingFrequency),
    notificationsEnabled: data.notificationsEnabled ?? true,
  };
}

export function applySubscriptionBillingPatch(
  data: {
    baseMonthlyAmount?: number;
    amount?: number;
    billingStartDate?: string;
    startDate?: string;
    billingFrequency?: string;
    notificationsEnabled?: boolean;
  },
  updateData: Prisma.SubscriptionUpdateInput,
): void {
  const baseRaw = data.baseMonthlyAmount ?? data.amount;
  if (baseRaw !== undefined) {
    if (!Number.isFinite(baseRaw) || baseRaw <= 0) {
      throw new BadRequestException('baseMonthlyAmount must be greater than zero');
    }
    updateData.baseMonthlyAmount = baseRaw;
  }

  const startRaw = data.billingStartDate ?? data.startDate;
  if (startRaw) {
    const billingStartDate = new Date(startRaw);
    if (Number.isNaN(billingStartDate.getTime())) {
      throw new BadRequestException('billingStartDate is invalid');
    }
    updateData.billingStartDate = billingStartDate;
  }

  if (data.billingFrequency !== undefined) {
    updateData.billingFrequency = parseBillingFrequency(data.billingFrequency);
  }

  if (data.notificationsEnabled !== undefined) {
    updateData.notificationsEnabled = data.notificationsEnabled;
  }
}
