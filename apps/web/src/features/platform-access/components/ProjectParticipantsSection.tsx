'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/shared';
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
import { formatTeamSource } from '../team-member-labels';
import { AddProjectTeamMemberDialog } from './AddProjectTeamMemberDialog';

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
  const [addOpen, setAddOpen] = useState(false);
  const [busyEmployeeId, setBusyEmployeeId] = useState<string | null>(null);

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

  const addButton = (
    <PermissionGate module="PROJECTS" action="EDIT">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn('gap-1', embedded ? 'h-7 px-2 text-xs' : 'h-8')}
        onClick={() => setAddOpen(true)}
      >
        <Plus size={embedded ? 12 : 14} aria-hidden />
        Add
      </Button>
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
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Project participants</h3>
          {addButton}
        </div>
      )}

      {embedded && <div className="mb-2 flex items-center justify-end">{addButton}</div>}

      {!isDense && (
        <p className="text-muted-foreground mt-3 text-sm">
          Project-level access team. Product delivery slots sync members here automatically; manual
          admins can manage project settings and broader project context.
        </p>
      )}

      <div className={cn(DETAIL_SHEET_SECTION_BODY_CLASS, isDense ? 'mt-0' : 'mt-4')}>
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
          <ul className={cn('space-y-0.5', embedded && 'max-h-48 overflow-y-auto pr-0.5')}>
            {members.map((row) => (
              <ParticipantDenseRow
                key={row.id}
                row={row}
                busyEmployeeId={busyEmployeeId}
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            ))}
          </ul>
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
                          <SelectTrigger className="h-8">
                            <SelectValue />
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

      <AddProjectTeamMemberDialog
        projectId={projectId}
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={() => void load()}
        existingEmployeeIds={members.map((m) => m.employeeId)}
      />
    </section>
  );
}

function ParticipantDenseRow({
  row,
  busyEmployeeId,
  onRoleChange,
  onRemove,
}: {
  row: ProjectTeamMemberRow;
  busyEmployeeId: string | null;
  onRoleChange: (employeeId: string, role: 'ADMIN' | 'MEMBER') => void;
  onRemove: (employeeId: string) => void;
}) {
  const name = `${row.employee.firstName} ${row.employee.lastName}`;

  return (
    <li className="hover:bg-secondary/60 flex items-center gap-1.5 rounded-md px-1 py-1 transition-colors">
      <div className="min-w-0 flex-1" title={row.employee.email}>
        <p className="truncate text-xs font-medium">{name}</p>
        <p className="text-muted-foreground truncate text-[10px] leading-tight">
          {row.accessLevel} · {formatTeamSource(row.source)}
        </p>
      </div>
      <PermissionGate
        module="PROJECTS"
        action="EDIT"
        fallback={
          <Badge variant="secondary" className="text-[10px]">
            {row.role}
          </Badge>
        }
      >
        <Select
          value={row.role}
          disabled={busyEmployeeId === row.employeeId}
          onValueChange={(v) =>
            void onRoleChange(row.employeeId, (v as 'ADMIN' | 'MEMBER') ?? 'MEMBER')
          }
        >
          <SelectTrigger className="h-7 w-20 px-2 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </PermissionGate>
      <PermissionGate module="PROJECTS" action="EDIT">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 shrink-0"
          aria-label={`Remove ${name}`}
          disabled={busyEmployeeId === row.employeeId}
          onClick={() => void onRemove(row.employeeId)}
        >
          <Trash2 size={12} />
        </Button>
      </PermissionGate>
    </li>
  );
}
