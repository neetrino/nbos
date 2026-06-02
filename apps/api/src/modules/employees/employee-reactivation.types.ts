export type EmployeeReactivationTargetStatus = 'ACTIVE' | 'PROBATION';

export interface EmployeeReactivationResult {
  employeeId: string;
  status: string;
  fireDate: null;
  checklistInstanceId: string;
  previousFireDate: string | null;
}
