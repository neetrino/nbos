import { employeePersonSelect } from '../../common/employee-person.select';

export const teamMemberEmployeeSelect = {
  ...employeePersonSelect,
  email: true,
  position: true,
  status: true,
} as const;
