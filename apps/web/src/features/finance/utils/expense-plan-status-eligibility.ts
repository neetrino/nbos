import type { ExpensePlan } from '@/lib/api/expense-plans';

export function expensePlanIsCancelled(plan: Pick<ExpensePlan, 'status'>): boolean {
  return plan.status === 'CANCELLED';
}

export function expensePlanCanCancel(plan: Pick<ExpensePlan, 'status'>): boolean {
  return plan.status === 'ACTIVE';
}

export function expensePlanCanResume(plan: Pick<ExpensePlan, 'status'>): boolean {
  return plan.status === 'CANCELLED';
}

export function expensePlanCanGenerateCard(plan: Pick<ExpensePlan, 'status'>): boolean {
  return plan.status === 'ACTIVE';
}
