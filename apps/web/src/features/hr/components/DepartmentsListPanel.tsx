'use client';

import { Building2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DepartmentAdminRow } from '@/features/hr/components/DepartmentAdminRow';
import { PermissionGate } from '@/lib/permissions';
import type { DepartmentItem, DepartmentWithMembers } from '@/lib/api/employees';

export function DepartmentsListPanel({
  departments,
  expandedId,
  expandedMembers,
  loadingMembers,
  onToggleExpand,
  onCreate,
}: {
  departments: DepartmentItem[];
  expandedId: string | null;
  expandedMembers: DepartmentWithMembers | null;
  loadingMembers: boolean;
  onToggleExpand: (dept: DepartmentItem) => void;
  onCreate: () => void;
}) {
  const t = useTranslations('hr');
  const roots = departments.filter((department) => !department.parentId);
  const getChildren = (parentId: string) =>
    departments.filter((department) => department.parentId === parentId);

  if (departments.length === 0) {
    return (
      <div className="text-muted-foreground border-border flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12">
        <Building2 className="size-12" />
        <p>{t('deptAdmin.empty')}</p>
        <PermissionGate module="COMPANY" action="ADD">
          <Button variant="outline" onClick={onCreate}>
            <Plus className="mr-2 size-4" />
            {t('deptAdmin.create')}
          </Button>
        </PermissionGate>
      </div>
    );
  }

  return (
    <div className="border-border mt-14 rounded-lg border">
      {roots.map((department) => (
        <DepartmentAdminRow
          key={department.id}
          department={department}
          getChildren={getChildren}
          expandedId={expandedId}
          expandedMembers={expandedMembers}
          loadingMembers={loadingMembers}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  );
}
