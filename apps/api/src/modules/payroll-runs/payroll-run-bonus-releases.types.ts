export interface PayrollRunBonusReleaseRowDto {
  id: string;
  bonusEntryId: string;
  employeeId: string;
  employeeName: string;
  projectCode: string;
  projectName: string;
  orderCode: string;
  productLabel: string;
  bonusType: string;
  releaseType: string;
  status: string;
  amount: string;
  payrollIncludedAmount: string | null;
}

export interface PayrollRunBonusReleasesDto {
  payrollRunId: string;
  payrollMonth: string;
  runStatus: string;
  canAttach: boolean;
  included: PayrollRunBonusReleaseRowDto[];
  availableToAttach: PayrollRunBonusReleaseRowDto[];
}
