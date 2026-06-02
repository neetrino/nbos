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
import { getEmployeeLevel, getEmployeeStatus } from '@/features/hr/constants/hr';
import {
  employeeFullName,
  employeeInitials,
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
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Primary seat</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tenure</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => {
            const lvl = emp.level ? getEmployeeLevel(emp.level) : null;
            const st = getEmployeeStatus(emp.status);
            return (
              <TableRow key={emp.id} className="cursor-pointer" onClick={() => onOpen(emp)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-accent/15 text-accent flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold">
                      {employeeInitials(emp)}
                    </div>
                    <span className="font-medium">{employeeFullName(emp)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{emp.position || emp.role?.name || '—'}</TableCell>
                <TableCell>
                  {lvl && <StatusBadge label={lvl.label} variant={lvl.variant} />}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {employeePrimaryDepartment(emp) ?? '—'}
                </TableCell>
                <TableCell>{st && <StatusBadge label={st.label} variant={st.variant} />}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {employeeTenure(emp.hireDate)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{emp.email}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
