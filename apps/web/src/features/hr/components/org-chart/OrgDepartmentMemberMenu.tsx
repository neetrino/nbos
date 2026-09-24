'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DepartmentItem, DepartmentMember } from '@/lib/api/employees';
import type { OrgSeat } from '@/lib/api/org-seats';
import {
  ORG_DEPT_ROLE_DEPUTY,
  ORG_DEPT_ROLE_HEAD,
  ORG_DEPT_ROLE_MEMBER,
} from './org-chart-constants';
import {
  OrgDepartmentMemberConfirmDialog,
  type OrgMemberPendingAction,
} from './OrgDepartmentMemberConfirmDialog';
import {
  executeOrgMemberPendingAction,
  orgMemberActionConfirmDescription,
  orgMemberActionConfirmTitle,
  orgMemberActionErrorMessage,
  orgMemberActionSuccessMessage,
} from './org-department-member-action-copy';
import { departmentHasSeats, findLeadershipSeat } from './org-department-member-actions';
import { orgChartMemberLabel } from './OrgChartPersonRow';

export function OrgDepartmentMemberMenu({
  member,
  departmentId,
  departmentName,
  seats,
  departments,
  canEdit,
  onOpenEmployee,
  onChanged,
}: {
  member: DepartmentMember;
  departmentId: string;
  departmentName: string;
  seats: readonly OrgSeat[];
  departments: readonly DepartmentItem[];
  canEdit: boolean;
  onOpenEmployee?: (employeeId: string) => void;
  onChanged: () => void;
}) {
  const t = useTranslations('hr');
  const [pending, setPending] = useState<OrgMemberPendingAction | null>(null);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [saving, setSaving] = useState(false);
  const name = orgChartMemberLabel(member);
  const hasSeats = departmentHasSeats(seats);
  const transferOptions = useMemo(
    () => departments.filter((department) => department.id !== departmentId),
    [departmentId, departments],
  );

  if (!canEdit && !onOpenEmployee) return null;

  async function runPending(): Promise<void> {
    if (!pending) return;
    setSaving(true);
    try {
      await executeOrgMemberPendingAction({
        pending,
        member,
        departmentId,
        seats,
        transferTargetId,
      });
      toast.success(orgMemberActionSuccessMessage(pending, t));
      setPending(null);
      setTransferTargetId('');
      onChanged();
    } catch (error) {
      toast.error(orgMemberActionErrorMessage(error, t));
    } finally {
      setSaving(false);
    }
  }

  function clearPending(): void {
    setPending(null);
    setTransferTargetId('');
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              size="icon-sm"
              variant="ghost"
              className="shrink-0"
              aria-label={t('orgChart.memberActions.menuAria', { name })}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          )}
        />
        <DropdownMenuContent align="end" className="w-72">
          <MemberActionItems
            member={member}
            canEdit={canEdit}
            hasSeats={hasSeats}
            seats={seats}
            transferDisabled={transferOptions.length === 0}
            onOpenEmployee={onOpenEmployee}
            onPending={setPending}
            t={t}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <OrgDepartmentMemberConfirmDialog
        pending={pending}
        title={orgMemberActionConfirmTitle(pending, t)}
        description={orgMemberActionConfirmDescription(pending, t, name, departmentName)}
        cancelLabel={t('orgChart.memberActions.cancel')}
        confirmLabel={t('orgChart.memberActions.confirm')}
        transferPlaceholder={t('orgChart.memberActions.transferPlaceholder')}
        transferTargetId={transferTargetId}
        transferOptions={transferOptions}
        saving={saving}
        onTransferTargetChange={setTransferTargetId}
        onCancel={clearPending}
        onConfirm={() => void runPending()}
      />
    </>
  );
}

function MemberActionItems({
  member,
  canEdit,
  hasSeats,
  seats,
  transferDisabled,
  onOpenEmployee,
  onPending,
  t,
}: {
  member: DepartmentMember;
  canEdit: boolean;
  hasSeats: boolean;
  seats: readonly OrgSeat[];
  transferDisabled: boolean;
  onOpenEmployee?: (employeeId: string) => void;
  onPending: (action: OrgMemberPendingAction) => void;
  t: ReturnType<typeof useTranslations<'hr'>>;
}) {
  return (
    <>
      {onOpenEmployee ? (
        <DropdownMenuItem onClick={() => onOpenEmployee(member.employeeId)}>
          <UserRound className="mr-2 size-4" aria-hidden />
          <MenuCopy
            title={t('orgChart.memberActions.openProfile')}
            description={t('orgChart.memberActions.openProfileHint')}
          />
        </DropdownMenuItem>
      ) : null}
      {canEdit ? (
        <>
          {onOpenEmployee ? <DropdownMenuSeparator /> : null}
          {member.deptRole !== ORG_DEPT_ROLE_HEAD ? (
            <DropdownMenuItem
              disabled={hasSeats && !findLeadershipSeat(seats, ORG_DEPT_ROLE_HEAD)}
              onClick={() => onPending({ kind: 'role', role: ORG_DEPT_ROLE_HEAD })}
            >
              <ArrowUp className="mr-2 size-4 text-sky-600" aria-hidden />
              <MenuCopy
                title={t('orgChart.memberActions.assignHead')}
                description={t('orgChart.memberActions.assignHeadHint')}
              />
            </DropdownMenuItem>
          ) : null}
          {member.deptRole !== ORG_DEPT_ROLE_DEPUTY ? (
            <DropdownMenuItem
              disabled={hasSeats && !findLeadershipSeat(seats, ORG_DEPT_ROLE_DEPUTY)}
              onClick={() => onPending({ kind: 'role', role: ORG_DEPT_ROLE_DEPUTY })}
            >
              <ArrowUp className="mr-2 size-4 text-sky-600" aria-hidden />
              <MenuCopy
                title={t('orgChart.memberActions.assignDeputy')}
                description={t('orgChart.memberActions.assignDeputyHint')}
              />
            </DropdownMenuItem>
          ) : null}
          {member.deptRole !== ORG_DEPT_ROLE_MEMBER ? (
            <DropdownMenuItem
              onClick={() => onPending({ kind: 'role', role: ORG_DEPT_ROLE_MEMBER })}
            >
              <ArrowDown className="mr-2 size-4 text-sky-600" aria-hidden />
              <MenuCopy
                title={t('orgChart.memberActions.makeMember')}
                description={t('orgChart.memberActions.makeMemberHint')}
              />
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={transferDisabled}
            onClick={() => onPending({ kind: 'transfer' })}
          >
            <ArrowLeftRight className="mr-2 size-4 text-sky-600" aria-hidden />
            <MenuCopy
              title={t('orgChart.memberActions.transfer')}
              description={t('orgChart.memberActions.transferHint')}
            />
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onPending({ kind: 'remove' })}>
            <Trash2 className="mr-2 size-4" aria-hidden />
            <MenuCopy
              title={t('orgChart.memberActions.remove')}
              description={t('orgChart.memberActions.removeHint')}
            />
          </DropdownMenuItem>
        </>
      ) : null}
    </>
  );
}

function MenuCopy({ title, description }: { title: string; description: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5 text-left">
      <span className="text-sm font-medium">{title}</span>
      <span className="text-muted-foreground text-xs leading-snug whitespace-normal">
        {description}
      </span>
    </span>
  );
}
