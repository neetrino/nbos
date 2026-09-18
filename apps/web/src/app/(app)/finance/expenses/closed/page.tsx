import { redirect } from 'next/navigation';
import { expensesClosedAliasHref } from '@/features/finance/constants/project-expenses-drilldown';

/** Alias for Pay now Closed — same page, lifecycle scope Closed. */
export default async function ExpensesClosedRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(expensesClosedAliasHref(await searchParams));
}
