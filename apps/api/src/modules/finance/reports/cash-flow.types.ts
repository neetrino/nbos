export interface CashFlowQuery {
  dateFrom?: string;
  dateTo?: string;
  asOf?: string;
}

export interface CashFlowForecastBucket {
  horizonDays: 30 | 60 | 90;
  expectedIncoming: string;
  expectedOutgoing: string;
  netExpected: string;
}

export interface CashFlowReport {
  reportId: 'cash-flow';
  title: 'Cash Flow';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    basis: 'cash';
    asOf: string;
  };
  actuals: {
    realIncoming: string;
    realOutgoing: string;
    netMovement: string;
    paymentCount: number;
    expensePaymentCount: number;
  };
  forecast: {
    expectedIncomingOpenInvoices: string;
    expectedOutgoingExpenseCards: string;
    expectedOutgoingExpensePlans: string;
    expectedOutgoingPayroll: string;
    buckets: CashFlowForecastBucket[];
  };
  backlogDebt: {
    amount: string;
    expenseCount: number;
  };
  notes: string[];
}
