'use client';

import type { PayrollEmployeeBonusHistoryEmployee } from '@/lib/api/payroll-employee-bonus-history';
import { cn } from '@/lib/utils';

function employeeName(employee: { firstName: string; lastName: string }): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function PayrollEmployeeBonusHistoryTabs({
  employees,
  selectedEmployeeId,
  onSelect,
  onPrefetch,
}: {
  employees: PayrollEmployeeBonusHistoryEmployee[];
  selectedEmployeeId: string | null;
  onSelect: (employeeId: string) => void;
  onPrefetch: (employeeId: string) => void;
}) {
  return (
    <div
      className="border-border bg-muted/20 flex gap-1 overflow-x-auto rounded-xl border p-1.5"
      role="tablist"
      aria-label="Employees"
    >
      {employees.map((employee) => {
        const active = employee.employeeId === selectedEmployeeId;
        return (
          <button
            key={employee.employeeId}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              'shrink-0 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:border-border hover:bg-card/80 hover:text-foreground border-transparent',
            )}
            onClick={() => onSelect(employee.employeeId)}
            onMouseEnter={() => onPrefetch(employee.employeeId)}
          >
            <span className="block font-semibold">{employeeName(employee)}</span>
            {employee.position ? (
              <span
                className={cn(
                  'block max-w-[12rem] truncate text-xs',
                  active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                )}
              >
                {employee.position}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
