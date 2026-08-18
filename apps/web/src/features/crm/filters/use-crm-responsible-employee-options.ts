'use client';

import { useEffect, useState } from 'react';
import { searchEmployeesForPicker } from '@/lib/employees';
import type { CrmResponsibleEmployeeOption } from './crm-responsible-filter';

const EMPTY_EMPLOYEES: CrmResponsibleEmployeeOption[] = [];

/** Active employees for the CRM Responsible filter (cached directory). */
export function useCrmResponsibleEmployeeOptions(): CrmResponsibleEmployeeOption[] {
  const [employees, setEmployees] = useState<CrmResponsibleEmployeeOption[]>(EMPTY_EMPLOYEES);

  useEffect(() => {
    let cancelled = false;
    void searchEmployeesForPicker('')
      .then((options) => {
        if (cancelled) return;
        setEmployees(options.map((option) => ({ id: option.value, label: option.label })));
      })
      .catch(() => {
        if (!cancelled) setEmployees(EMPTY_EMPLOYEES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return employees;
}
