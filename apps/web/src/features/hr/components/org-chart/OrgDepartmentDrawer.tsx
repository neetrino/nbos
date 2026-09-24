'use client';

import { Search, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { isDeptRoleValue } from '@/features/hr/constants/team-directory';
import type { DepartmentItem, DepartmentMember, DepartmentWithMembers } from '@/lib/api/employees';
import type { OrgSeat } from '@/lib/api/org-seats';
import { ORG_DRAWER_WIDTH_CLASS } from './org-chart-constants';
import { splitOrgChartMembers } from './org-chart-members';
import { OrgChartPersonRow, orgChartMemberLabel, orgChartMemberTitle } from './OrgChartPersonRow';
import { OrgDepartmentMemberMenu } from './OrgDepartmentMemberMenu';

export function OrgDepartmentDrawer({
  department,
  loading,
  seats,
  departments,
  canEdit,
  onClose,
  onOpenEmployee,
  onMembersChanged,
}: {
  department: DepartmentWithMembers | null;
  loading: boolean;
  seats: readonly OrgSeat[];
  departments: readonly DepartmentItem[];
  canEdit: boolean;
  onClose: () => void;
  onOpenEmployee?: (employeeId: string) => void;
  onMembersChanged: () => void;
}) {
  const t = useTranslations('hr');
  const [query, setQuery] = useState('');
  const groups = splitOrgChartMembers(department?.members ?? []);
  const filtered = useMemo(
    () => filterDrawerMembers(department?.members ?? [], query),
    [department?.members, query],
  );
  const filteredGroups = splitOrgChartMembers(filtered);
  const total = department?._count?.members ?? department?.members.length ?? 0;
  const title = department?.name ?? t('deptAdmin.loading');

  return (
    <Sheet
      open
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        hideOverlay
        className={cn('flex h-full flex-col gap-0 overflow-hidden p-0', ORG_DRAWER_WIDTH_CLASS)}
      >
        <header className="flex items-center justify-between gap-2 px-4 pt-5 pb-3">
          <SheetTitle className="truncate text-base font-semibold">{title}</SheetTitle>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
            aria-label={t('orgChart.closeDrawer')}
          >
            <X className="size-4" />
          </Button>
        </header>
        <SheetDescription className="px-4 text-xs">
          {t('orgChart.totalEmployees', { count: total })}
        </SheetDescription>
        <div className="relative px-4 py-3">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-6 size-3.5 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('orgChart.membersSearch')}
            className="h-9 rounded-full pl-8 text-sm"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">{t('deptAdmin.loadingMembers')}</p>
          ) : (
            <OrgDepartmentDrawerBody
              groups={query.trim() ? filteredGroups : groups}
              departmentId={department?.id ?? ''}
              departmentName={title}
              seats={seats}
              departments={departments}
              canEdit={canEdit}
              onOpenEmployee={onOpenEmployee}
              onMembersChanged={onMembersChanged}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function filterDrawerMembers(members: DepartmentMember[], query: string): DepartmentMember[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return members;
  return members.filter((member) => {
    const haystack = `${orgChartMemberLabel(member)} ${orgChartMemberTitle(member)}`.toLowerCase();
    return haystack.includes(needle);
  });
}

function OrgDepartmentDrawerBody({
  groups,
  departmentId,
  departmentName,
  seats,
  departments,
  canEdit,
  onOpenEmployee,
  onMembersChanged,
}: {
  groups: ReturnType<typeof splitOrgChartMembers>;
  departmentId: string;
  departmentName: string;
  seats: readonly OrgSeat[];
  departments: readonly DepartmentItem[];
  canEdit: boolean;
  onOpenEmployee?: (employeeId: string) => void;
  onMembersChanged: () => void;
}) {
  const t = useTranslations('hr');
  const leaders = [...groups.heads, ...groups.deputies];
  if (leaders.length === 0 && groups.members.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('deptAdmin.emptyMembers')}</p>;
  }
  return (
    <div className="flex flex-col gap-5">
      <DrawerSection title={t('orgChart.heads', { count: leaders.length })}>
        {leaders.map((member) => (
          <DrawerMemberRow
            key={member.id}
            member={member}
            departmentId={departmentId}
            departmentName={departmentName}
            seats={seats}
            departments={departments}
            canEdit={canEdit}
            onOpenEmployee={onOpenEmployee}
            onMembersChanged={onMembersChanged}
          />
        ))}
      </DrawerSection>
      <DrawerSection title={t('orgChart.subordinatesSection', { count: groups.members.length })}>
        {groups.members.map((member) => (
          <DrawerMemberRow
            key={member.id}
            member={member}
            departmentId={departmentId}
            departmentName={departmentName}
            seats={seats}
            departments={departments}
            canEdit={canEdit}
            onOpenEmployee={onOpenEmployee}
            onMembersChanged={onMembersChanged}
          />
        ))}
      </DrawerSection>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DrawerMemberRow({
  member,
  departmentId,
  departmentName,
  seats,
  departments,
  canEdit,
  onOpenEmployee,
  onMembersChanged,
}: {
  member: DepartmentMember;
  departmentId: string;
  departmentName: string;
  seats: readonly OrgSeat[];
  departments: readonly DepartmentItem[];
  canEdit: boolean;
  onOpenEmployee?: (employeeId: string) => void;
  onMembersChanged: () => void;
}) {
  const t = useTranslations('hr');
  const roleLabel = isDeptRoleValue(member.deptRole)
    ? t(`deptRole.${member.deptRole}`)
    : member.deptRole;
  return (
    <div className="hover:bg-muted/40 flex items-center gap-1 rounded-xl px-1 py-1">
      <div className="min-w-0 flex-1">
        <OrgChartPersonRow member={member} onOpen={onOpenEmployee} />
      </div>
      {member.deptRole !== 'MEMBER' ? (
        <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
          {roleLabel}
        </span>
      ) : null}
      <OrgDepartmentMemberMenu
        member={member}
        departmentId={departmentId}
        departmentName={departmentName}
        seats={seats}
        departments={departments}
        canEdit={canEdit}
        onOpenEmployee={onOpenEmployee}
        onChanged={onMembersChanged}
      />
    </div>
  );
}
