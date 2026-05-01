export interface CompanyPnlQuery {
  dateFrom?: string;
  dateTo?: string;
}

export interface CompanyPnlReport {
  reportId: 'company-pnl';
  title: 'Company P&L';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    basis: 'cash';
  };
  revenue: {
    incomingPayments: string;
    paymentCount: number;
  };
  costs: {
    actualExpensePayments: string;
    payrollExpensePayments: string;
    nonPayrollExpensePayments: string;
    expensePaymentCount: number;
  };
  payrollControl: {
    payrollRunCount: number;
    payrollRunPaid: string;
    payrollRunPayable: string;
  };
  profitability: {
    grossProfit: string;
    netProfit: string;
    marginPercent: number | null;
  };
  notes: string[];
}
