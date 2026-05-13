/** Labels for `Company.taxId` by `Company.type` (copy only; same enum values as API). */

export const COMPANY_TYPE_NUMBER_LABEL: Record<string, string> = {
  LEGAL: 'Registration or tax ID',
  SOLE_PROPRIETOR: 'State reg. no. or tax ID',
  INDIVIDUAL: 'Passport or ID number (optional)',
};

export function companyTypeNumberLabel(type: string): string {
  return COMPANY_TYPE_NUMBER_LABEL[type] ?? 'Tax ID';
}
