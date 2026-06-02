'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
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
}

export function ProjectParticipantsSection({ projectId }: ProjectParticipantsSectionProps) {
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
    <section className="border-border bg-card rounded-2xl border p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-muted-foreground" aria-hidden />
          <h2 className="text-foreground text-base font-semibold">Project participants</h2>
        </div>
        <PermissionGate module="PROJECTS" action="EDIT">
          <Button type="button" size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus size={16} aria-hidden />
            Add participant
          </Button>
        </PermissionGate>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        Project-level access team. Product delivery slots sync members here automatically; manual
        admins can manage project settings and broader project context.
      </p>

      {error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : loading ? (
        <LoadingState count={3} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No participants yet"
          description="Add a project participant or assign people on products."
        />
      ) : (
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
                  <span className="text-muted-foreground block text-xs">{row.employee.email}</span>
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
                        void handleRoleChange(row.employeeId, (v as 'ADMIN' | 'MEMBER') ?? 'MEMBER')
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
      )}

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
