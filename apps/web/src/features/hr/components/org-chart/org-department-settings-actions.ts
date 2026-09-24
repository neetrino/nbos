import { employeesApi } from '@/lib/api/employees';
import { orgSeatsApi, type OrgSeat } from '@/lib/api/org-seats';
import { ORG_DEPT_ROLE_MEMBER } from './org-chart-constants';
import { activeAssignmentForEmployee } from './org-department-member-actions';

export async function addEmployeeAsDepartmentMember(params: {
  employeeId: string;
  departmentId: string;
}): Promise<void> {
  const employee = await employeesApi.getById(params.employeeId);
  const already = employee.departments.some((item) => item.departmentId === params.departmentId);
  if (already) return;
  await employeesApi.addDepartment(params.employeeId, {
    departmentId: params.departmentId,
    deptRole: ORG_DEPT_ROLE_MEMBER,
  });
}

/** Remove from every other department (ending seats first), then ensure membership here. */
export async function transferEmployeeIntoDepartment(params: {
  employeeId: string;
  departmentId: string;
}): Promise<void> {
  const [employee, allSeats] = await Promise.all([
    employeesApi.getById(params.employeeId),
    orgSeatsApi.getAll(),
  ]);
  const seats = Array.isArray(allSeats) ? allSeats : [];
  for (const membership of employee.departments) {
    if (membership.departmentId === params.departmentId) continue;
    const departmentSeats = seats.filter((seat) => seat.departmentId === membership.departmentId);
    await endSeatsAndRemove(params.employeeId, membership.departmentId, departmentSeats);
  }
  const stillHere = employee.departments.some((item) => item.departmentId === params.departmentId);
  if (!stillHere) {
    await employeesApi.addDepartment(params.employeeId, {
      departmentId: params.departmentId,
      deptRole: ORG_DEPT_ROLE_MEMBER,
    });
  }
}

async function endSeatsAndRemove(
  employeeId: string,
  departmentId: string,
  seats: readonly OrgSeat[],
): Promise<void> {
  for (const item of activeAssignmentForEmployee(seats, employeeId)) {
    await orgSeatsApi.endAssignment(item.assignmentId, 'Transferred to another department');
  }
  await employeesApi.removeDepartment(employeeId, departmentId);
}
