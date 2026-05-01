import { BadRequestException } from '@nestjs/common';
import { type SubscriptionStatusEnum } from '@nbos/database';

export const SUBSCRIPTION_STATUSES: SubscriptionStatusEnum[] = [
  'PENDING',
  'ACTIVE',
  'ON_HOLD',
  'CANCELLED',
  'COMPLETED',
];

interface SubscriptionForCoverage {
  amount: number | string | { toString(): string };
  status: string;
  startDate: Date | string;
  endDate?: Date | string | null;
}

export interface SubscriptionCoverageSummary {
  firstCoveredMonth: number | null;
  activeMonthCount: number;
  annualizedAmount: number;
}

export function assertSubscriptionStatus(status: string): asserts status is SubscriptionStatusEnum {
  if (!SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatusEnum)) {
    throw new BadRequestException(`Invalid subscription status: ${status}`);
  }
}

export function buildSubscriptionCoverage(
  subscription: SubscriptionForCoverage,
  year = new Date().getFullYear(),
): SubscriptionCoverageSummary {
  if (subscription.status !== 'ACTIVE') {
    return emptyCoverage();
  }

  const startDate = new Date(subscription.startDate);
  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  if (startDate.getFullYear() > year || (endDate && endDate.getFullYear() < year)) {
    return emptyCoverage();
  }

  const firstMonth = startDate.getFullYear() === year ? startDate.getMonth() : 0;
  const lastMonth = endDate && endDate.getFullYear() === year ? endDate.getMonth() : 11;
  const activeMonthCount = Math.max(0, lastMonth - firstMonth + 1);

  return {
    firstCoveredMonth: activeMonthCount > 0 ? firstMonth : null,
    activeMonthCount,
    annualizedAmount: Number(subscription.amount) * activeMonthCount,
  };
}

export function attachSubscriptionCoverage<T extends SubscriptionForCoverage>(subscription: T) {
  return { ...subscription, coverage: buildSubscriptionCoverage(subscription) };
}

function emptyCoverage(): SubscriptionCoverageSummary {
  return {
    firstCoveredMonth: null,
    activeMonthCount: 0,
    annualizedAmount: 0,
  };
}
