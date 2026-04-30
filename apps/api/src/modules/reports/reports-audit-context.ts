export const REPORT_FINANCE_CONFIDENTIALITY = 'FINANCE_SENSITIVE';

export function buildSensitiveReportAuditContext(reportKey: string | null) {
  return {
    sensitive: true,
    confidentiality: REPORT_FINANCE_CONFIDENTIALITY,
    sourceModule: 'FINANCE',
    reportKey,
    sensitivityReason:
      'Finance-owned report output can include P&L, payroll or client finance data.',
  };
}
