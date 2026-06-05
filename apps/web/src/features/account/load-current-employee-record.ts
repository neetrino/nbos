import { employeesApi, type Employee } from '@/lib/api/employees';
import { meApi } from '@/lib/api/me';

/** Loads the signed-in employee in Employee-sheet shape. */
export async function loadCurrentEmployeeRecord(
  employeeId: string,
  canViewCompanyDirectory: boolean,
): Promise<Employee> {
  if (canViewCompanyDirectory) {
    return employeesApi.getById(employeeId);
  }
  return meApi.getEmployee();
}
