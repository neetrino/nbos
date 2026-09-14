import type { RelationPickerOption } from '@/components/shared/relation-picker';
import { employeesApi } from '@/lib/api/employees';
import { EMPLOYEE_PICKER_PAGE_SIZE } from '@/lib/employees/employee-directory-constants';

/**
 * Seat assignees are searched server-side so the picker is not limited to the first page,
 * and cover every non-terminated status the API accepts, not only `ACTIVE`.
 */
export async function searchSeatAssignees(query: string): Promise<RelationPickerOption[]> {
  const search = query.trim();
  const page = await employeesApi.getAll({
    page: 1,
    pageSize: EMPLOYEE_PICKER_PAGE_SIZE,
    ...(search ? { search } : {}),
  });
  return page.items
    .filter((employee) => employee.status !== 'TERMINATED')
    .map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`.trim(),
      subtitle: employee.position ?? employee.email,
      avatar: employee.avatar?.trim() || undefined,
    }));
}
