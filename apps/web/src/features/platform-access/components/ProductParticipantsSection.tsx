'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/shared';
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
import { cn } from '@/lib/utils';

interface ProductParticipantsSectionProps {
  productId: string;
  /** Inside {@link ProductInfoPanel} — minimal rows, no card chrome. */
  embedded?: boolean;
  className?: string;
}

export function ProductParticipantsSection({
  productId,
  embedded = false,
  className,
}: ProductParticipantsSectionProps) {
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
        <>
          <div className="mb-4 flex items-center gap-2">
            <Users size={18} className="text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-semibold">Product team (access)</h3>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            Product-scoped access only — slots sync from delivery roles on this product.
          </p>
        </>
      )}

      <div className={cn(DETAIL_SHEET_SECTION_BODY_CLASS, embedded ? 'mt-0 space-y-3' : 'mt-0')}>
        <TeamBody
          error={error}
          loading={loading}
          members={members}
          onRetry={() => void load()}
          embedded={embedded}
        />
      </div>
    </section>
  );
}

function TeamBody({
  error,
  loading,
  members,
  onRetry,
  embedded,
}: {
  error: string | null;
  loading: boolean;
  members: ProductTeamMemberRow[];
  onRetry: () => void;
  embedded: boolean;
}) {
  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  if (loading) {
    return <LoadingState count={embedded ? 2 : 3} />;
  }

  if (members.length === 0) {
    if (embedded) {
      return (
        <p className="text-muted-foreground text-xs">
          No product team yet. Assign delivery roles on this product to populate the team.
        </p>
      );
    }

    return (
      <EmptyState
        icon={Users}
        title="No product team yet"
        description="Assign delivery roles on this product to populate the team."
      />
    );
  }

  if (embedded) {
    return (
      <div className="max-h-52 space-y-2 overflow-y-auto pr-0.5">
        {members.map((row) => (
          <div
            key={row.id}
            className="bg-muted/30 flex items-start justify-between gap-2 rounded-lg px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.employee.firstName} {row.employee.lastName}
              </p>
              <p className="text-muted-foreground truncate text-[11px]">{row.employee.email}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-xs capitalize">{formatProductSlot(row.slot)}</span>
              {row.isPrimary && row.slot ? (
                <Badge variant="outline" className="text-[10px]">
                  primary
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
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
  );
}
