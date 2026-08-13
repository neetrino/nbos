import { BadRequestException } from '@nestjs/common';
import type { Prisma, SubscriptionBillingFrequencyEnum } from '@nbos/database';

const BILLING_FREQUENCIES: SubscriptionBillingFrequencyEnum[] = ['MONTHLY', 'YEARLY', 'CUSTOM'];
const CUSTOM_PREPAID_MONTH_MIN = 2;
const CUSTOM_PREPAID_MONTH_MAX = 60;

export interface ResolvedSubscriptionBillingInput {
  baseMonthlyAmount: number;
  billingStartDate: Date;
  billingFrequency: SubscriptionBillingFrequencyEnum;
  prepaidMonthCount: number | null;
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
  prepaidMonthCount?: number | null;
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

  const billingFrequency = parseBillingFrequency(data.billingFrequency);
  return {
    baseMonthlyAmount: baseRaw,
    billingStartDate,
    billingFrequency,
    prepaidMonthCount: resolvePrepaidMonthCountForFrequency(
      billingFrequency,
      data.prepaidMonthCount,
    ),
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
    prepaidMonthCount?: number | null;
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

  applyFrequencyAndPrepaidPatch(data, updateData);

  if (data.notificationsEnabled !== undefined) {
    updateData.notificationsEnabled = data.notificationsEnabled;
  }
}

function applyFrequencyAndPrepaidPatch(
  data: {
    billingFrequency?: string;
    prepaidMonthCount?: number | null;
  },
  updateData: Prisma.SubscriptionUpdateInput,
): void {
  const frequencyProvided = data.billingFrequency !== undefined;
  const prepaidProvided = data.prepaidMonthCount !== undefined;

  if (!frequencyProvided) {
    if (prepaidProvided) {
      throw new BadRequestException(
        'prepaidMonthCount can only be set together with billingFrequency CUSTOM',
      );
    }
    return;
  }

  const nextFrequency = parseBillingFrequency(data.billingFrequency);
  updateData.billingFrequency = nextFrequency;
  if (nextFrequency === 'CUSTOM') {
    updateData.prepaidMonthCount = resolvePrepaidMonthCountForFrequency(
      'CUSTOM',
      data.prepaidMonthCount,
    );
    return;
  }
  if (prepaidProvided && data.prepaidMonthCount != null) {
    throw new BadRequestException(
      'prepaidMonthCount must not be set when billingFrequency is MONTHLY or YEARLY',
    );
  }
  updateData.prepaidMonthCount = null;
}

function resolvePrepaidMonthCountForFrequency(
  billingFrequency: SubscriptionBillingFrequencyEnum,
  prepaidMonthCount: number | null | undefined,
): number | null {
  if (billingFrequency === 'CUSTOM') {
    return parseCustomPrepaidMonthCount(prepaidMonthCount);
  }
  if (prepaidMonthCount != null) {
    throw new BadRequestException(
      'prepaidMonthCount must not be set when billingFrequency is MONTHLY or YEARLY',
    );
  }
  return null;
}

function parseCustomPrepaidMonthCount(value: number | null | undefined): number {
  if (
    value == null ||
    !Number.isInteger(value) ||
    value < CUSTOM_PREPAID_MONTH_MIN ||
    value > CUSTOM_PREPAID_MONTH_MAX
  ) {
    throw new BadRequestException(
      `prepaidMonthCount is required for CUSTOM billingFrequency and must be an integer from ${CUSTOM_PREPAID_MONTH_MIN} to ${CUSTOM_PREPAID_MONTH_MAX}`,
    );
  }
  return value;
}
