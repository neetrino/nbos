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
import { platformAccessApi, type ProductTeamMemberRow } from '@/lib/api/platform-access';
import { formatProductSlot, formatTeamSource } from '../team-member-labels';

interface ProductParticipantsSectionProps {
  productId: string;
}

export function ProductParticipantsSection({ productId }: ProductParticipantsSectionProps) {
  const [members, setMembers] = useState<ProductTeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await platformAccessApi.listProductTeam(productId);
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product team');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <div className="mb-4 flex items-center gap-2">
        <Users size={18} className="text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold">Product team (access)</h3>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        Product-scoped access only — does not grant automatic access to sibling products on the
        project. Slots sync from the delivery card (PM, Developer, …).
      </p>

      {error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : loading ? (
        <LoadingState count={3} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No product team yet"
          description="Assign delivery roles on this product to populate the team."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">Slot</TableHead>
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
                  <span className="capitalize">{formatProductSlot(row.slot)}</span>
                  {row.isPrimary && row.slot ? (
                    <Badge variant="outline" className="ml-1 text-xs">
                      primary
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm">{row.accessLevel}</TableCell>
                <TableCell className="text-muted-foreground text-sm capitalize">
                  {formatTeamSource(row.source)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
