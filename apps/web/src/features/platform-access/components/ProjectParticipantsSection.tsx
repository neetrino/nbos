'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { platformAccessApi, type ProjectTeamMemberRow } from '@/lib/api/platform-access';

interface ProjectParticipantsSectionProps {
  projectId: string;
}

function formatSource(source: string): string {
  return source.replace(/_/g, ' ').toLowerCase();
}

export function ProjectParticipantsSection({ projectId }: ProjectParticipantsSectionProps) {
  const [members, setMembers] = useState<ProjectTeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="border-border bg-card rounded-2xl border p-5">
      <div className="mb-4 flex items-center gap-2">
        <Users size={18} className="text-muted-foreground" aria-hidden />
        <h2 className="text-foreground text-base font-semibold">Project participants</h2>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        Platform access team for this project. Product delivery slots and extensions sync into
        product team membership automatically.
      </p>

      {error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : loading ? (
        <LoadingState count={3} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No participants yet"
          description="Assign people on products or add project team members via API."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">Role</TableHead>
              <TableHead className="w-24">Access</TableHead>
              <TableHead className="w-32">Source</TableHead>
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
                  <Badge variant={row.role === 'ADMIN' ? 'default' : 'secondary'}>{row.role}</Badge>
                </TableCell>
                <TableCell className="text-sm">{row.accessLevel}</TableCell>
                <TableCell className="text-muted-foreground text-sm capitalize">
                  {formatSource(row.source)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
