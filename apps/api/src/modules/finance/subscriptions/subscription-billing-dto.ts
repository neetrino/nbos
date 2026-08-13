import { BadRequestException } from '@nestjs/common';
import type { Prisma, SubscriptionBillingFrequencyEnum } from '@nbos/database';

const BILLING_FREQUENCIES: SubscriptionBillingFrequencyEnum[] = ['MONTHLY', 'YEARLY', 'CUSTOM'];
const MONTHLY_COVERAGE_MONTH_COUNT = 1;
const YEARLY_COVERAGE_MONTH_COUNT = 12;
const CUSTOM_COVERAGE_MONTH_MIN = 2;
const CUSTOM_COVERAGE_MONTH_MAX = 60;
/** Minimum covered months for a fixed-term subscription. */
const SUBSCRIPTION_TERM_MONTHS_MIN = 1;
/** Maximum covered months for a fixed-term subscription. */
const SUBSCRIPTION_TERM_MONTHS_MAX = 120;

export interface ResolvedSubscriptionBillingInput {
  amount: number;
  billingStartDate: Date;
  billingFrequency: SubscriptionBillingFrequencyEnum;
  coverageMonthCount: number;
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
  amount?: number;
  billingStartDate?: string;
  startDate?: string;
  billingFrequency?: string;
  coverageMonthCount?: number | null;
  notificationsEnabled?: boolean;
}): ResolvedSubscriptionBillingInput {
  const amountRaw = data.amount;
  if (amountRaw === undefined || !Number.isFinite(amountRaw) || amountRaw <= 0) {
    throw new BadRequestException('amount must be greater than zero');
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
    amount: amountRaw,
    billingStartDate,
    billingFrequency,
    coverageMonthCount: resolveCoverageMonthCountForFrequency(
      billingFrequency,
      data.coverageMonthCount,
    ),
    notificationsEnabled: data.notificationsEnabled ?? true,
  };
}

export function applySubscriptionBillingPatch(
  data: {
    amount?: number;
    billingStartDate?: string;
    startDate?: string;
    billingFrequency?: string;
    coverageMonthCount?: number | null;
    notificationsEnabled?: boolean;
  },
  updateData: Prisma.SubscriptionUpdateInput,
): void {
  if (data.amount !== undefined) {
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }
    updateData.amount = data.amount;
  }

  const startRaw = data.billingStartDate ?? data.startDate;
  if (startRaw) {
    const billingStartDate = new Date(startRaw);
    if (Number.isNaN(billingStartDate.getTime())) {
      throw new BadRequestException('billingStartDate is invalid');
    }
    updateData.billingStartDate = billingStartDate;
  }

  applyFrequencyAndCoveragePatch(data, updateData);

  if (data.notificationsEnabled !== undefined) {
    updateData.notificationsEnabled = data.notificationsEnabled;
  }
}

function applyFrequencyAndCoveragePatch(
  data: {
    billingFrequency?: string;
    coverageMonthCount?: number | null;
  },
  updateData: Prisma.SubscriptionUpdateInput,
): void {
  const frequencyProvided = data.billingFrequency !== undefined;
  const coverageProvided = data.coverageMonthCount !== undefined;

  if (!frequencyProvided) {
    if (coverageProvided) {
      throw new BadRequestException(
        'coverageMonthCount can only be set together with billingFrequency CUSTOM',
      );
    }
    return;
  }

  const nextFrequency = parseBillingFrequency(data.billingFrequency);
  updateData.billingFrequency = nextFrequency;
  updateData.coverageMonthCount = resolveCoverageMonthCountForFrequency(
    nextFrequency,
    data.coverageMonthCount,
  );
}

function resolveCoverageMonthCountForFrequency(
  billingFrequency: SubscriptionBillingFrequencyEnum,
  coverageMonthCount: number | null | undefined,
): number {
  if (billingFrequency === 'MONTHLY') {
    assertNoCustomCoverage(coverageMonthCount, billingFrequency);
    return MONTHLY_COVERAGE_MONTH_COUNT;
  }
  if (billingFrequency === 'YEARLY') {
    assertNoCustomCoverage(coverageMonthCount, billingFrequency);
    return YEARLY_COVERAGE_MONTH_COUNT;
  }
  return parseCustomCoverageMonthCount(coverageMonthCount);
}

function assertNoCustomCoverage(
  coverageMonthCount: number | null | undefined,
  billingFrequency: SubscriptionBillingFrequencyEnum,
): void {
  if (coverageMonthCount != null) {
    throw new BadRequestException(
      `coverageMonthCount must not be set when billingFrequency is ${billingFrequency}`,
    );
  }
}

function parseCustomCoverageMonthCount(value: number | null | undefined): number {
  if (
    value == null ||
    !Number.isInteger(value) ||
    value < CUSTOM_COVERAGE_MONTH_MIN ||
    value > CUSTOM_COVERAGE_MONTH_MAX
  ) {
    throw new BadRequestException(
      `coverageMonthCount is required for CUSTOM billingFrequency and must be an integer from ${CUSTOM_COVERAGE_MONTH_MIN} to ${CUSTOM_COVERAGE_MONTH_MAX}`,
    );
  }
  return value;
}

/**
 * Validates optional `termMonths` on create/update.
 * `undefined` = omit / leave untouched; `null` = open-ended; otherwise integer 1..120.
 */
export function parseOptionalTermMonths(
  value: number | null | undefined,
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (
    !Number.isInteger(value) ||
    value < SUBSCRIPTION_TERM_MONTHS_MIN ||
    value > SUBSCRIPTION_TERM_MONTHS_MAX
  ) {
    throw new BadRequestException(
      `termMonths must be an integer from ${SUBSCRIPTION_TERM_MONTHS_MIN} to ${SUBSCRIPTION_TERM_MONTHS_MAX}, or null`,
    );
  }
  return value;
}
