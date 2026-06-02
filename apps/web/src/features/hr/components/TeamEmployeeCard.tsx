'use client';

import { Mail, Phone, Calendar, Building2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { getEmployeeLevel, getEmployeeStatus } from '@/features/hr/constants/hr';
import {
  employeeFullName,
  employeeInitials,
  employeePrimaryDepartment,
  employeeTenure,
} from '@/features/hr/utils/employee-display';
import type { Employee } from '@/lib/api/employees';

interface TeamEmployeeCardProps {
  employee: Employee;
  onOpen: (employee: Employee) => void;
}

export function TeamEmployeeCard({ employee, onOpen }: TeamEmployeeCardProps) {
  const lvl = employee.level ? getEmployeeLevel(employee.level) : null;
  const st = getEmployeeStatus(employee.status);
  const dept = employeePrimaryDepartment(employee);

  return (
    <button
      type="button"
      onClick={() => onOpen(employee)}
      className="border-border bg-card hover:border-accent/40 focus-visible:ring-ring group w-full rounded-xl border p-5 text-left transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start gap-3">
        <div className="bg-accent/15 text-accent group-hover:bg-accent/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors">
          {employeeInitials(employee)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{employeeFullName(employee)}</p>
          <p className="text-muted-foreground truncate text-xs">
            {employee.position || employee.role?.name || '—'}
            {dept ? ` · ${dept}` : ''}
          </p>
        </div>
        {st && <StatusBadge label={st.label} variant={st.variant} />}
      </div>

      <div className="mt-4 space-y-1.5">
        {lvl && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Building2 size={12} />
            <StatusBadge label={lvl.label} variant={lvl.variant} />
          </div>
        )}
        {employee.email && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Mail size={12} />
            <span className="truncate">{employee.email}</span>
          </div>
        )}
        {employee.phone && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Phone size={12} />
            <span>{employee.phone}</span>
          </div>
        )}
        {employee.hireDate && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Calendar size={12} />
            <span>Tenure: {employeeTenure(employee.hireDate)}</span>
          </div>
        )}
      </div>
    </button>
  );
}
