/**
 * Human-readable **page title prefixes** for Finance routes (before `FINANCE_DOCUMENT_TITLE_SUFFIX`).
 * Used with `useFinanceDocumentTitle` / `buildFinanceDocumentTitle`.
 */

export function financeDashboardPageTitle(): string {
  return 'Dashboard';
}

export function paymentsListPageTitle(): string {
  return 'Payments';
}

export function payrollRunsListPageTitle(): string {
  return 'Payroll';
}

export function salaryBoardPageTitle(): string {
  return 'Salary';
}

export function bonusBoardPageTitle(): string {
  return 'Bonus';
}

export function employeeWalletPageTitle(): string {
  return 'My wallet';
}

export function bonusProjectPoolsPageTitle(): string {
  return 'Bonus pools';
}

export function payrollRunDetailPageTitle(payrollMonth: string | null | undefined): string {
  const m = payrollMonth?.trim();
  if (!m) return 'Payroll run';
  return `Payroll · ${m}`;
}

export function invoicesListPageTitle(hasSubscriptionDrilldown: boolean): string {
  return hasSubscriptionDrilldown ? 'Invoices · subscription filter' : 'Invoices';
}

export function ordersListPageTitle(
  hasPartnerDrilldown: boolean,
  hasReconciliationGap: boolean,
): string {
  if (hasPartnerDrilldown && hasReconciliationGap) return 'Orders · partner & gap filter';
  if (hasPartnerDrilldown) return 'Orders · partner filter';
  if (hasReconciliationGap) return 'Orders · reconciliation filter';
  return 'Orders';
}

export function subscriptionsListPageTitle(hasPartnerDrilldown: boolean): string {
  return hasPartnerDrilldown ? 'Subscriptions · partner filter' : 'Subscriptions';
}

export function expensesListPageTitle(hasProjectDrilldown: boolean): string {
  return hasProjectDrilldown ? 'Pay now · project filter' : 'Pay now';
}

export function expensePlansListPageTitle(): string {
  return 'Expense plans';
}

export function clientServicesPageTitle(): string {
  return 'Client services';
}

export function financeReportsPageTitle(): string {
  return 'Finance reports';
}

export function financeJournalPageTitle(): string {
  return 'Journal';
}

export function expenseBacklogPageTitle(hasProjectDrilldown: boolean): string {
  return hasProjectDrilldown ? 'Expense backlog · project filter' : 'Expense backlog';
}

export function expenseClosedPageTitle(hasProjectDrilldown: boolean): string {
  return hasProjectDrilldown ? 'Closed expenses · project filter' : 'Closed expenses';
}

export interface ExpenseDetailPageTitleParams {
  loading: boolean;
  /** True when fetch finished and expense is missing or an error was set. */
  loadFailed: boolean;
  expenseName: string | null | undefined;
  fromBacklog: boolean;
  hasProjectDrilldown: boolean;
}

/**
 * `undefined` means leave the current document title unchanged (still loading).
 */
export function expenseDetailPageTitle(params: ExpenseDetailPageTitleParams): string | undefined {
  if (params.loading) return undefined;
  if (params.loadFailed || !params.expenseName?.trim()) return 'Expense';
  const name = params.expenseName.trim();
  if (!params.fromBacklog && !params.hasProjectDrilldown) return name;
  if (params.fromBacklog && params.hasProjectDrilldown) return `${name} · backlog · project filter`;
  if (params.fromBacklog) return `${name} · backlog`;
  return `${name} · project filter`;
}

export interface SubscriptionDetailPageTitleParams {
  loading: boolean;
  /** True when fetch finished and subscription is missing or an error was set. */
  loadFailed: boolean;
  subscriptionCode: string | null | undefined;
}

/**
 * `undefined` means leave the current document title unchanged (still loading).
 */
export function subscriptionDetailPageTitle(
  params: SubscriptionDetailPageTitleParams,
): string | undefined {
  if (params.loading) return undefined;
  if (params.loadFailed || !params.subscriptionCode?.trim()) return 'Subscription';
  return params.subscriptionCode.trim();
}
