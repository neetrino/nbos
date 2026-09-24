import type { CatalogSeedItem } from './catalog-seed-types';

/** Финансовый учёт внутри продукта клиента: счета, касса, расходы, отчётность. */
export const FINANCE_OPS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'FIN_INVOICES',
    category: 'finance_ops',
    iconKey: 'Receipt',
    title: 'Invoices and billing',
    summary: 'Invoice issuance with numbering and statuses.',
    scopeBoundaries:
      'Invoice lines, numbering, taxes and totals, printable form, payment statuses, and partial payment.',
    units: { BACKEND: 24, FRONTEND: 12, PM: 3, DESIGNER: 3, QA: 6 },
  },
  {
    code: 'FIN_PAYMENTS_LEDGER',
    category: 'finance_ops',
    iconKey: 'Banknote',
    title: 'Payment ledger',
    summary: 'Transaction ledger linked to invoices.',
    scopeBoundaries:
      'Receipts and outflows, invoice or order linkage, currency and exchange rate, reconciliation, and operation permissions.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 4, QA: 6 },
  },
  {
    code: 'FIN_CASH_REGISTER',
    category: 'finance_ops',
    iconKey: 'Store',
    title: 'Cash register and shifts',
    summary: 'Shift opening and closing with cash movements.',
    scopeBoundaries:
      'Shifts, cash deposits and withdrawals, shift report, discrepancies, and cashier permissions. Fiscal receipts are covered by the ՀԴՄ integration card.',
    units: { BACKEND: 22, FRONTEND: 14, PM: 3, QA: 6 },
  },
  {
    code: 'FIN_EXPENSES',
    category: 'finance_ops',
    iconKey: 'Wallet',
    title: 'Expense tracking',
    summary: 'Categorized expenses with supporting evidence.',
    scopeBoundaries:
      'Expense categories, attachments and confirmation, approval when needed, and period reporting.',
    units: { BACKEND: 18, FRONTEND: 10, PM: 3, QA: 4 },
  },
  {
    code: 'FIN_BUDGETS',
    category: 'finance_ops',
    iconKey: 'PieChart',
    title: 'Budgets and plans',
    summary: 'Line-item planning with execution control.',
    scopeBoundaries:
      'Budget lines and periods, plan versus actual, variances, and overspending warnings.',
    units: { BACKEND: 22, FRONTEND: 12, PM: 3, QA: 5 },
  },
  {
    code: 'FIN_PAYROLL',
    category: 'finance_ops',
    iconKey: 'Coins',
    title: 'Payroll calculation',
    summary: 'Employee accruals and payments for a period.',
    scopeBoundaries:
      'Salary and variable compensation, deductions, period calculation, payroll register, and payments. Tax reporting is a separate card.',
    units: { BACKEND: 34, FRONTEND: 16, PM: 5, QA: 10 },
  },
  {
    code: 'FIN_TAX_REPORTS',
    category: 'finance_ops',
    iconKey: 'FileSpreadsheet',
    title: 'Tax and statutory reports',
    summary: 'Report generation using agreed forms.',
    scopeBoundaries:
      'Agreed form set, metric calculation, export in the required format, and ledger reconciliation.',
    units: { BACKEND: 28, FRONTEND: 10, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'FIN_BANK_STATEMENT_IMPORT',
    category: 'finance_ops',
    iconKey: 'Upload',
    title: 'Bank statement import',
    summary: 'Statement upload and transaction matching.',
    scopeBoundaries:
      'One bank format, file parsing, automatic matching, manual matching of the remainder, and duplicate protection.',
    units: { BACKEND: 22, FRONTEND: 8, PM: 3, QA: 6 },
  },
  {
    code: 'FIN_DEBT_CONTROL',
    category: 'finance_ops',
    iconKey: 'Clock',
    title: 'Receivables control',
    summary: 'Customer debts by due date with reminders.',
    scopeBoundaries:
      'Aged debt calculation, limits and fulfillment blocking, reminders, and debtor reporting.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, QA: 5 },
  },
  {
    code: 'FIN_PARTNER_COMMISSIONS',
    category: 'finance_ops',
    iconKey: 'Percent',
    title: 'Partner commissions',
    summary: 'Reward calculation for partners and agents.',
    scopeBoundaries:
      'Commission rules, deal-based calculation, adjustments and reversals, partner report, and payouts through the agreed channel.',
    units: { BACKEND: 24, FRONTEND: 10, PM: 4, QA: 6 },
  },
  {
    code: 'FIN_COST_PRICE',
    category: 'finance_ops',
    iconKey: 'Gauge',
    title: 'Cost and margin calculation',
    summary: 'Sales cost and profit calculation.',
    scopeBoundaries:
      'Cost calculation method, purchases and returns, margin by product and order, and period reporting.',
    units: { BACKEND: 26, FRONTEND: 10, PM: 4, QA: 7 },
  },
] as const;
