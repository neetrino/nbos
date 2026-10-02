export const PAYROLL_DEV_MARKER = 'nbos:dev-synthetic:payroll-postgres';
export const PAYROLL_DEV_PREFIX = 'DEV-PAY-PG';
export const PAYROLL_DEV_PAY_DATE = '2098-06-15T00:00:00.000Z';
export const PAYROLL_DEV_POSTING_MONTH = '2098-06';

export const SALARY_AMD = '300000.00';
export const BONUS_AMD = '60000.00';
export const PARTIAL_CASH_AMD = '320000.00';
export const NAMED_BONUS_CASH_AMD = '20000.00';
export const BONUS_LEFT_AMD = '40000.00';
export const APPROVAL_SALARY_AMD = '100000.00';
export const RACE_CASH_AMD = '200000.00';

export type DevPayrollIds = {
  runToken: string;
  roleId?: string;
  employeeIds: string[];
  contactId?: string;
  companyId?: string;
  projectId?: string;
  dealId?: string;
  orderId?: string;
  entryIds: string[];
  releaseIds: string[];
  profileIds: string[];
  payrollRunIds: string[];
  expenseIds: string[];
  paymentIds: string[];
  invoiceIds: string[];
  policyId?: string;
  createdPostingMonths: string[];
};

export function emptyDevPayrollIds(runToken: string): DevPayrollIds {
  return {
    runToken,
    employeeIds: [],
    entryIds: [],
    releaseIds: [],
    profileIds: [],
    payrollRunIds: [],
    expenseIds: [],
    paymentIds: [],
    invoiceIds: [],
    createdPostingMonths: [],
  };
}
