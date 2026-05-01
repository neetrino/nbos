export interface PayrollReportQuery {
  dateFrom?: string;
  dateTo?: string;
}

export interface PayrollReportStatusRow {
  status: string;
  runCount: number;
  totalPayable: string;
  totalPaid: string;
  totalRemaining: string;
}

export interface PayrollReport {
  reportId: 'payroll-report';
  title: 'Payroll Report';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    basis: 'cash';
  };
  totals: {
    payrollRunCount: number;
    salaryLineCount: number;
    totalBaseSalary: string;
    totalBonuses: string;
    totalAdjustments: string;
    totalDeductions: string;
    totalPayable: string;
    totalPaid: string;
    totalRemaining: string;
    salaryExpensePaid: string;
    payrollAsPercentOfRevenue: number | null;
  };
  byStatus: PayrollReportStatusRow[];
  revenueControl: {
    incomingPayments: string;
    paymentCount: number;
  };
  notes: string[];
}
