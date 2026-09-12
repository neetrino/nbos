'use client';

import { Building2, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { isDeptRoleValue } from '@/features/hr/constants/team-directory';
import type { DepartmentItem, DepartmentWithMembers } from '@/lib/api/employees';

const DEPT_ROW_BASE_PAD_PX = 16;
const DEPT_ROW_DEPTH_STEP_PX = 24;

export interface DepartmentAdminRowProps {
  department: DepartmentItem;
  getChildren: (parentId: string) => DepartmentItem[];
  expandedId: string | null;
  expandedMembers: DepartmentWithMembers | null;
  loadingMembers: boolean;
  onToggleExpand: (dept: DepartmentItem) => void;
  depth?: number;
}

export function DepartmentAdminRow({
  department,
  getChildren,
  expandedId,
  expandedMembers,
  loadingMembers,
  onToggleExpand,
  depth = 0,
}: DepartmentAdminRowProps) {
  const t = useTranslations('hr');
  const children = getChildren(department.id);
  const isExpanded = expandedId === department.id;
  const memberCount = department._count?.members ?? 0;
  const padLeft = DEPT_ROW_BASE_PAD_PX + depth * DEPT_ROW_DEPTH_STEP_PX;
  const childPadLeft = DEPT_ROW_BASE_PAD_PX + (depth + 1) * DEPT_ROW_DEPTH_STEP_PX;

  return (
    <div className="border-border border-b last:border-b-0">
      <div
        className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
        style={{ paddingLeft: `${padLeft}px` }}
        onClick={() => onToggleExpand(department)}
      >
        <span className="text-muted-foreground shrink-0">
          {children.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )
          ) : (
            <span className="inline-block w-4" />
          )}
        </span>
        <Building2 className="text-muted-foreground size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{department.name}</span>
            <span className="text-muted-foreground text-sm">{department.slug}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {department.parent && (
              <span>{t('deptAdmin.parentOf', { name: department.parent.name })}</span>
            )}
            <span>•</span>
            <span>{t('deptAdmin.membersCount', { count: memberCount })}</span>
          </div>
        </div>
      </div>

      {isExpanded ? (
        <DepartmentAdminMembers
          padLeft={childPadLeft}
          loadingMembers={loadingMembers}
          expandedMembers={expandedMembers}
        />
      ) : null}

      {children.map((child) => (
        <DepartmentAdminRow
          key={child.id}
          department={child}
          getChildren={getChildren}
          expandedId={expandedId}
          expandedMembers={expandedMembers}
          loadingMembers={loadingMembers}
          onToggleExpand={onToggleExpand}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function DepartmentAdminMembers({
  padLeft,
  loadingMembers,
  expandedMembers,
}: {
  padLeft: number;
  loadingMembers: boolean;
  expandedMembers: DepartmentWithMembers | null;
}) {
  const t = useTranslations('hr');
  if (loadingMembers) {
    return (
      <div className="bg-muted/30 border-border border-t" style={{ paddingLeft: `${padLeft}px` }}>
        <div className="text-muted-foreground py-4 text-sm">{t('deptAdmin.loadingMembers')}</div>
      </div>
    );
  }
  const members = expandedMembers?.members ?? [];
  return (
    <div className="bg-muted/30 border-border border-t" style={{ paddingLeft: `${padLeft}px` }}>
      {members.length > 0 ? (
        <div className="flex flex-col gap-1 py-3 pr-4">
          {members.map((m) => (
            <div key={m.id} className="hover:bg-muted/50 flex items-center gap-3 rounded-md px-3 py-2">
              <Users className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {m.employee.firstName} {m.employee.lastName}
              </span>
              <Badge variant="secondary" className="shrink-0">
                {isDeptRoleValue(m.deptRole) ? t(`deptRole.${m.deptRole}`) : m.deptRole}
              </Badge>
              {m.isPrimary ? (
                <Badge variant="outline" className="shrink-0">
                  {t('departments.primary')}
                </Badge>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground py-4 text-sm">{t('deptAdmin.emptyMembers')}</div>
      )}
    </div>
  );
}
