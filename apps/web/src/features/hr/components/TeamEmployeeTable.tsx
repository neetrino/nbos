'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import {
  ENTITY_LIST_BADGE_CLASS,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
  EntityListMutedDash,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
import { getEmployeeLevel, getEmployeeStatus } from '@/features/hr/constants/hr';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import {
  employeeFullName,
  employeePrimaryDepartment,
  employeeTenure,
} from '@/features/hr/utils/employee-display';
import type { Employee } from '@/lib/api/employees';

interface TeamEmployeeTableProps {
  employees: Employee[];
  onOpen: (employee: Employee) => void;
}

export function TeamEmployeeTable({ employees, onOpen }: TeamEmployeeTableProps) {
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Employee</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Primary seat</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Level</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Department</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Status</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Tenure</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => {
            const lvl = emp.level ? getEmployeeLevel(emp.level) : null;
            const st = getEmployeeStatus(emp.status);
            const seat = emp.position || emp.role?.name;
            const department = employeePrimaryDepartment(emp);
            return (
              <TableRow
                key={emp.id}
                className={`${ENTITY_LIST_ROW_HOVER_CLASS} cursor-pointer`}
                onClick={() => onOpen(emp)}
              >
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <div className="flex items-center gap-2">
                    <EmployeePersonAvatar
                      label={employeeFullName(emp)}
                      imageUrl={emp.avatar}
                      className="size-8 text-[10px]"
                    />
                    <EntityListPrimaryCell title={employeeFullName(emp)} />
                  </div>
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {seat ? <span className="text-sm">{seat}</span> : <EntityListMutedDash />}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {lvl ? (
                    <StatusBadge
                      label={lvl.label}
                      variant={lvl.variant}
                      className={ENTITY_LIST_BADGE_CLASS}
                    />
                  ) : null}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {department ? (
                    <span className="text-muted-foreground text-sm">{department}</span>
                  ) : (
                    <EntityListMutedDash />
                  )}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {st ? (
                    <StatusBadge
                      label={st.label}
                      variant={st.variant}
                      className={ENTITY_LIST_BADGE_CLASS}
                    />
                  ) : null}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground text-xs`}>
                  {employeeTenure(emp.hireDate)}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground text-xs`}>
                  {emp.email}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
