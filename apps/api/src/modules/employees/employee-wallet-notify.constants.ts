/** In-app notification `type` values for Employee Wallet (NBOS §08). */
export const WALLET_NOTIFY_TYPES = {
  BONUS_ACTIVE: 'finance.wallet.bonus_active',
  BONUS_PAID: 'finance.wallet.bonus_paid',
  BONUS_CORRECTED: 'finance.wallet.bonus_corrected',
  BONUS_KPI_REDUCED: 'finance.wallet.bonus_kpi_reduced',
  PAYROLL_CREATED: 'finance.wallet.payroll_created',
  PAYROLL_CLOSED: 'finance.wallet.payroll_closed',
  SALARY_PAYMENT: 'finance.wallet.salary_payment',
} as const;
