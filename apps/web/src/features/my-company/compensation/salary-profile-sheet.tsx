'use client';

import { useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared/EntityDetailSheetContent';
import {
  TEAM_SHEET_HEADER_CLASS,
  TEAM_SHEET_WIDTH,
} from '@/features/hr/constants/team-sheet-layout';
import { CompensationProfileWorkspace } from '@/features/my-company/compensation/compensation-profile-workspace';
import type { Employee } from '@/lib/api/employees';

export function SalaryProfileSheet({
  employee,
  open,
  onOpenChange,
  onSalaryActivated,
}: {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalaryActivated: (employeeId: string, baseSalary: string) => void;
}) {
  const t = useTranslations('hr.salaries');
  if (!employee) return null;
  const name = `${employee.firstName} ${employee.lastName}`.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width={TEAM_SHEET_WIDTH}
        sourcePageHref={`/my-company/compensation?employee=${employee.id}`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className={TEAM_SHEET_HEADER_CLASS}>
            <h2 className="truncate text-base font-semibold">{name}</h2>
            <p className="text-muted-foreground mt-1 text-xs">{t('sheetHint')}</p>
          </div>
          <CompensationProfileWorkspace
            employees={[employee]}
            initialEmployeeId={employee.id}
            onSalaryActivated={onSalaryActivated}
          />
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
