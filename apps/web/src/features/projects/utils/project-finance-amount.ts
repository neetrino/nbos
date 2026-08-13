/** Parses subscription MRR from project API rows (`monthlyEquivalentAmount`). */
import type { ProjectSubscription } from '@/lib/api/projects';

export function projectSubscriptionMonthlyAmount(sub: ProjectSubscription): number {
  const parsed = Number(sub.monthlyEquivalentAmount);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatProjectFinanceAmount(amount: number | string): string {
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed.toLocaleString('en-US') : '0';
}
