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
  /** Narrow column in project overview grid — list layout, shorter copy. */
  compact?: boolean;
  className?: string;
}

export function ProjectParticipantsSection({
  projectId,
  compact = false,
  className,
}: ProjectParticipantsSectionProps) {
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

  return (
    <section
      className={cn(
        DETAIL_SHEET_SECTION_STRETCH_CLASS,
        'bg-card border-border rounded-xl border p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Project participants</h3>
        <PermissionGate module="PROJECTS" action="EDIT">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={14} aria-hidden />
            Add
          </Button>
        </PermissionGate>
      </div>

      {!compact && (
        <p className="text-muted-foreground mt-3 text-sm">
          Project-level access team. Product delivery slots sync members here automatically; manual
          admins can manage project settings and broader project context.
        </p>
      )}

      <div className={cn(DETAIL_SHEET_SECTION_BODY_CLASS, compact ? 'mt-3' : 'mt-4')}>
        {error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : loading ? (
          <LoadingState count={compact ? 2 : 3} />
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No participants yet"
            description={
              compact
                ? 'Add a participant or assign people on products.'
                : 'Add a project participant or assign people on products.'
            }
          />
        ) : compact ? (
          <ul className="divide-border -mx-1 min-h-0 flex-1 divide-y overflow-y-auto">
            {members.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {row.employee.firstName} {row.employee.lastName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{row.employee.email}</p>
                  </div>
                  <PermissionGate module="PROJECTS" action="EDIT">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 shrink-0"
                      aria-label="Remove participant"
                      disabled={busyEmployeeId === row.employeeId}
                      onClick={() => void handleRemove(row.employeeId)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </PermissionGate>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PermissionGate
                    module="PROJECTS"
                    action="EDIT"
                    fallback={<Badge variant="secondary">{row.role}</Badge>}
                  >
                    <Select
                      value={row.role}
                      disabled={busyEmployeeId === row.employeeId}
                      onValueChange={(v) =>
                        void handleRoleChange(row.employeeId, (v as 'ADMIN' | 'MEMBER') ?? 'MEMBER')
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </PermissionGate>
                  <span className="text-muted-foreground text-xs">
                    {row.accessLevel} · {formatTeamSource(row.source)}
                  </span>
                </div>
              </li>
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
