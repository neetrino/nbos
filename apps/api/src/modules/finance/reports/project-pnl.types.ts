export interface ProjectPnlQuery {
  dateFrom?: string;
  dateTo?: string;
}

export interface ProjectPnlRow {
  projectId: string;
  projectCode: string | null;
  projectName: string;
  revenue: string;
  actualCosts: string;
  netProfit: string;
  marginPercent: number | null;
  paymentCount: number;
  expensePaymentCount: number;
}

export interface ProjectPnlReport {
  reportId: 'project-pnl';
  title: 'Project P&L';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    basis: 'cash';
  };
  totals: {
    projectCount: number;
    revenue: string;
    actualCosts: string;
    netProfit: string;
    marginPercent: number | null;
    paymentCount: number;
    expensePaymentCount: number;
  };
  topProjects: ProjectPnlRow[];
  notes: string[];
}
