'use client';

import { useCallback, useMemo, useState } from 'react';
import { Trash2, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
  DETAIL_SHEET_TAB_LIST_CLASS,
  EmptyState,
  ErrorState,
  LoadingState,
  RELATION_PICKER_CHIP_STACK_CLASS,
  RelationPickerField,
} from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { useEmployeeRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { platformAccessApi } from '@/lib/api/platform-access';
import { toast } from 'sonner';
import { useProjectTeamManagementAccess } from '../hooks/use-project-team-management-access';
import { useProjectTeam } from '../hooks/use-project-team';
import { formatTeamSource } from '../team-member-labels';
import { ProjectTeamMemberChipRow } from './ProjectTeamMemberChipRow';
import { ProjectTeamRoleControl } from './ProjectTeamRoleControl';
import { TeamMemberEmployeeStatusBadge } from './TeamMemberEmployeeStatusBadge';

const DEFAULT_PROJECT_TEAM_ROLE = 'MEMBER' as const;

interface ProjectParticipantsSectionProps {
  projectId: string;
  /** Bump after project entity writes that may change synced team members. */
  refreshKey?: number;
  /** Inside {@link ProjectInfoPanel} — minimal rows, no card chrome. */
  embedded?: boolean;
  /** Narrow column — list layout, shorter copy. */
  compact?: boolean;
  className?: string;
}

export function ProjectParticipantsSection({
  projectId,
  refreshKey = 0,
  embedded = false,
  compact = false,
  className,
}: ProjectParticipantsSectionProps) {
  const isDense = embedded || compact;
  const { members, loading, error, refetch } = useProjectTeam(projectId, refreshKey);
  const [addingMember, setAddingMember] = useState(false);
  const [busyEmployeeId, setBusyEmployeeId] = useState<string | null>(null);

  const existingEmployeeIds = useMemo(
    () => new Set(members.map((member) => member.employeeId)),
    [members],
  );
  const { canManageTeam, canAssignAdmin } = useProjectTeamManagementAccess(members);
  const searchEmployees = useEmployeeRelationSearch(existingEmployeeIds);
  const employeePicker = useRelationPickerActions('employee', 'project-team');

  const reloadTeam = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleRoleChange = async (employeeId: string, role: 'ADMIN' | 'MEMBER') => {
    if (role === 'ADMIN' && !canAssignAdmin) {
      toast.error('Only Owner, CEO, or project admins can assign the Admin role.');
      return;
    }
    setBusyEmployeeId(employeeId);
    try {
      await platformAccessApi.updateProjectTeamMember(projectId, employeeId, { role });
      toast.success('Role updated');
      await reloadTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setBusyEmployeeId(null);
    }
  };

  const handleAddMember = async (employeeId: string, label: string) => {
    setAddingMember(true);
    try {
      await platformAccessApi.addProjectTeamMember(projectId, {
        employeeId,
        role: DEFAULT_PROJECT_TEAM_ROLE,
      });
      toast.success('Participant added', { description: `${label} · Member` });
      await reloadTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add participant');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemove = async (employeeId: string) => {
    setBusyEmployeeId(employeeId);
    try {
      await platformAccessApi.removeProjectTeamMember(projectId, employeeId);
      toast.success('Participant removed');
      await reloadTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setBusyEmployeeId(null);
    }
  };

  const addMemberPicker = canManageTeam ? (
    <RelationPickerField
      label="Add member"
      entityKind="employee"
      value={null}
      selectionLabel={null}
      placeholder="Search employee…"
      icon={<User size={12} />}
      disabled={addingMember || busyEmployeeId !== null}
      onSearch={searchEmployees}
      onSelect={(id, label) => void handleAddMember(id, label)}
      {...employeePicker}
    />
  ) : null;

  return (
    <section
      className={cn(
        !embedded && [
          DETAIL_SHEET_SECTION_STRETCH_CLASS,
          'bg-card border-border rounded-xl border p-5',
        ],
        embedded && 'flex min-h-0 flex-1 flex-col',
        className,
      )}
    >
      {!embedded && <h3 className="text-sm font-semibold">Project participants</h3>}

      {!isDense && (
        <p className="text-muted-foreground mt-3 text-sm">
          Product roles (PM, dev, design, seller, …) sync here as Member automatically. Owner, CEO,
          and project admins can add people manually and promote to Admin.
        </p>
      )}

      <div
        className={cn(
          DETAIL_SHEET_SECTION_BODY_CLASS,
          isDense ? 'mt-0 flex min-h-0 flex-1 flex-col gap-3' : 'mt-4 space-y-4',
        )}
      >
        {addMemberPicker}
        {error ? (
          <ErrorState description={error} onRetry={() => void reloadTeam()} />
        ) : loading ? (
          <LoadingState count={isDense ? 2 : 3} />
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No participants yet"
            description={
              isDense
                ? 'Add a participant or assign on products.'
                : 'Add a project participant or assign people on products.'
            }
          />
        ) : isDense ? (
          <div
            className={cn(
              RELATION_PICKER_CHIP_STACK_CLASS,
              embedded && cn(DETAIL_SHEET_TAB_LIST_CLASS, 'overscroll-contain pr-0.5'),
            )}
          >
            {members.map((row) => (
              <ProjectTeamMemberChipRow
                key={row.id}
                row={row}
                disabled={busyEmployeeId === row.employeeId || addingMember}
                canManageTeam={canManageTeam}
                canAssignAdmin={canAssignAdmin}
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-36">Role</TableHead>
                  <TableHead className="w-24">Access</TableHead>
                  <TableHead className="w-32">Source</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">
                          {row.employee.firstName} {row.employee.lastName}
                        </span>
                        <TeamMemberEmployeeStatusBadge status={row.employee.status} />
                      </div>
                      <span className="text-muted-foreground block text-xs">
                        {row.employee.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ProjectTeamRoleControl
                        role={row.role as 'ADMIN' | 'MEMBER'}
                        disabled={busyEmployeeId === row.employeeId}
                        canManageTeam={canManageTeam}
                        canAssignAdmin={canAssignAdmin}
                        onRoleChange={(role) => void handleRoleChange(row.employeeId, role)}
                      />
                    </TableCell>
                    <TableCell className="text-sm">{row.accessLevel}</TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">
                      {formatTeamSource(row.source)}
                    </TableCell>
                    <TableCell>
                      {canManageTeam ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Remove participant"
                          disabled={busyEmployeeId === row.employeeId}
                          onClick={() => void handleRemove(row.employeeId)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}
