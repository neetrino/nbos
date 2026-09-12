'use client';

import { useTranslations } from 'next-intl';
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
import {
  getEmployeeLevel,
  getEmployeeStatus,
  isEmployeeLevelValue,
  isEmployeeStatusValue,
} from '@/features/hr/constants/hr';
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
  const t = useTranslations('hr');

  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>
              {t('directory.columns.employee')}
            </TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>
              {t('directory.columns.primarySeat')}
            </TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('directory.columns.level')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>
              {t('directory.columns.department')}
            </TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>
              {t('directory.columns.status')}
            </TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>
              {t('directory.columns.tenure')}
            </TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('directory.columns.email')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => {
            const lvl = emp.level ? getEmployeeLevel(emp.level) : null;
            const st = getEmployeeStatus(emp.status);
            const seat = emp.position || emp.role?.name;
            const department = employeePrimaryDepartment(emp);
            const statusLabel =
              st && isEmployeeStatusValue(emp.status) ? t(`status.${emp.status}`) : st?.label;
            const levelLabel =
              lvl && emp.level && isEmployeeLevelValue(emp.level)
                ? t(`level.${emp.level}`)
                : lvl?.label;
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
                  {lvl && levelLabel ? (
                    <StatusBadge
                      label={levelLabel}
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
                  {st && statusLabel ? (
                    <StatusBadge
                      label={statusLabel}
                      variant={st.variant}
                      className={ENTITY_LIST_BADGE_CLASS}
                    />
                  ) : null}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground text-xs`}>
                  {employeeTenure(emp.hireDate, t)}
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
