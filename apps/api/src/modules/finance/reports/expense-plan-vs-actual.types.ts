export interface ExpensePlanVsActualQuery {
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpensePlanVsActualCategoryRow {
  category: string;
  plannedAmount: string;
  generatedCardAmount: string;
  paidAmount: string;
  variancePlannedVsPaid: string;
  planCount: number;
  cardCount: number;
  paymentCount: number;
}

export interface ExpensePlanVsActualReport {
  reportId: 'expense-plan-vs-actual';
  title: 'Expense Plan vs Actual';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    basis: 'cash';
  };
  totals: {
    plannedAmount: string;
    generatedCardAmount: string;
    paidAmount: string;
    variancePlannedVsPaid: string;
    planCount: number;
    cardCount: number;
    paymentCount: number;
  };
  byCategory: ExpensePlanVsActualCategoryRow[];
  notes: string[];
}
