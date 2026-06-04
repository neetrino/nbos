'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2, User, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
  EmptyState,
  ErrorState,
  LoadingState,
  RELATION_PICKER_CHIP_STACK_CLASS,
  RELATION_PICKER_CHIP_TRAILING_SELECT_CLASS,
  RelationPickerField,
} from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { useEmployeeRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PermissionGate } from '@/lib/permissions';
import { platformAccessApi, type ProjectTeamMemberRow } from '@/lib/api/platform-access';
import { toast } from 'sonner';
import { formatTeamSource, projectTeamRoleShortLabel } from '../team-member-labels';
import { ProjectTeamMemberChipRow } from './ProjectTeamMemberChipRow';

const DEFAULT_PROJECT_TEAM_ROLE = 'MEMBER' as const;

interface ProjectParticipantsSectionProps {
  projectId: string;
  /** Inside {@link ProjectInfoPanel} — minimal rows, no card chrome. */
  embedded?: boolean;
  /** Narrow column — list layout, shorter copy. */
  compact?: boolean;
  className?: string;
}

export function ProjectParticipantsSection({
  projectId,
  embedded = false,
  compact = false,
  className,
}: ProjectParticipantsSectionProps) {
  const isDense = embedded || compact;
  const [members, setMembers] = useState<ProjectTeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [busyEmployeeId, setBusyEmployeeId] = useState<string | null>(null);

  const existingEmployeeIds = useMemo(
    () => new Set(members.map((member) => member.employeeId)),
    [members],
  );
  const searchEmployees = useEmployeeRelationSearch(existingEmployeeIds);
  const employeePicker = useRelationPickerActions('employee', 'project-team');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await platformAccessApi.listProjectTeam(projectId);
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRoleChange = async (employeeId: string, role: 'ADMIN' | 'MEMBER') => {
    setBusyEmployeeId(employeeId);
    try {
      await platformAccessApi.updateProjectTeamMember(projectId, employeeId, { role });
      toast.success('Role updated');
      await load();
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
      await load();
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
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setBusyEmployeeId(null);
    }
  };

  const addMemberPicker = (
    <PermissionGate module="PROJECTS" action="EDIT">
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
    </PermissionGate>
  );

  return (
    <section
      className={cn(
        !embedded && [
          DETAIL_SHEET_SECTION_STRETCH_CLASS,
          'bg-card border-border rounded-xl border p-5',
        ],
        className,
      )}
    >
      {!embedded && <h3 className="text-sm font-semibold">Project participants</h3>}

      {!isDense && (
        <p className="text-muted-foreground mt-3 text-sm">
          New participants are added as Member; change role to Admin after adding if needed.
        </p>
      )}

      <div
        className={cn(
          DETAIL_SHEET_SECTION_BODY_CLASS,
          isDense ? 'mt-0 space-y-3' : 'mt-4 space-y-4',
        )}
      >
        {addMemberPicker}
        {error ? (
          <ErrorState description={error} onRetry={() => void load()} />
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
              embedded && 'max-h-52 overflow-y-auto pr-0.5',
            )}
          >
            {members.map((row) => (
              <ProjectTeamMemberChipRow
                key={row.id}
                row={row}
                disabled={busyEmployeeId === row.employeeId || addingMember}
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
                      <span className="font-medium">
                        {row.employee.firstName} {row.employee.lastName}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {row.employee.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PermissionGate
                        module="PROJECTS"
                        action="EDIT"
                        fallback={<Badge>{row.role}</Badge>}
                      >
                        <Select
                          value={row.role}
                          disabled={busyEmployeeId === row.employeeId}
                          onValueChange={(v) =>
                            void handleRoleChange(
                              row.employeeId,
                              (v as 'ADMIN' | 'MEMBER') ?? 'MEMBER',
                            )
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            className={cn(
                              RELATION_PICKER_CHIP_TRAILING_SELECT_CLASS,
                              'tracking-normal normal-case',
                            )}
                          >
                            <SelectValue>{projectTeamRoleShortLabel(row.role)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </PermissionGate>
                    </TableCell>
                    <TableCell className="text-sm">{row.accessLevel}</TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">
                      {formatTeamSource(row.source)}
                    </TableCell>
                    <TableCell>
                      <PermissionGate module="PROJECTS" action="EDIT">
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
                      </PermissionGate>
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
