export interface MarketingAccountQuery {
  channel?: string;
  status?: string;
  search?: string;
}

export interface CreateMarketingAccountDto {
  channel: string;
  name: string;
  identifier?: string | null;
  phone?: string | null;
  status?: string;
  financeExpensePlanId?: string | null;
  defaultCost?: number | null;
  ownerId?: string | null;
  notes?: string | null;
}

export interface UpdateMarketingAccountDto {
  channel?: string;
  name?: string;
  identifier?: string | null;
  phone?: string | null;
  status?: string;
  financeExpensePlanId?: string | null;
  defaultCost?: number | null;
  ownerId?: string | null;
  notes?: string | null;
}

export interface MarketingActivityQuery {
  channel?: string;
  status?: string;
  accountId?: string;
  search?: string;
}

export interface CreateMarketingActivityDto {
  title: string;
  channel: string;
  type: string;
  status?: string;
  accountId?: string | null;
  ownerId?: string | null;
  description?: string | null;
  budget?: number | null;
  currency?: string;
  startDate?: string | null;
  endDate?: string | null;
  expectedPayAt?: string | null;
  expenseCardId?: string | null;
  expensePlanId?: string | null;
  notes?: string | null;
}

export interface UpdateMarketingActivityDto {
  title?: string;
  channel?: string;
  type?: string;
  status?: string;
  accountId?: string | null;
  ownerId?: string | null;
  description?: string | null;
  budget?: number | null;
  currency?: string;
  startDate?: string | null;
  endDate?: string | null;
  expectedPayAt?: string | null;
  expenseCardId?: string | null;
  expensePlanId?: string | null;
  notes?: string | null;
}

export interface LaunchMarketingActivityDto {
  startDate: string;
  endDate?: string | null;
  budget?: number | null;
  expectedPayAt?: string | null;
  accountId?: string | null;
  noExpenseReason?: string | null;
}

export interface AttributionOption {
  id: string;
  label: string;
  type: 'ACCOUNT' | 'ACTIVITY' | 'ORGANIC';
  channel: string;
  subtitle?: string;
}
