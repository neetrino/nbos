import type { ResponsibleEmployee } from '@/lib/api/clients';

export function responsibleEmployeeLabel(employee: ResponsibleEmployee | null | undefined): string {
  if (!employee) return '';
  return `${employee.firstName} ${employee.lastName}`.trim();
}
