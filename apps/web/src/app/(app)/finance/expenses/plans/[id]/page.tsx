import { redirect } from 'next/navigation';
import { expensePlansListWithOpenPlanHref } from '@/features/finance/constants/expense-plan-deep-link';

/** Legacy full-page URLs open the plan detail sheet on the list route. */
export default async function ExpensePlanDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(expensePlansListWithOpenPlanHref(id));
}
