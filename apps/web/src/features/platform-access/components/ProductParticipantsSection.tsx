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
import { OverviewPanel } from '@/features/projects/components/product-tabs/product-overview-ui';

interface ProductParticipantsSectionProps {
  productId: string;
  compact?: boolean;
}

export function ProductParticipantsSection({
  productId,
  compact = false,
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

  const hint = 'Product-scoped access — slots sync from delivery roles on this product.';

  if (compact) {
    return (
      <OverviewPanel title="Product team (access)" hint={hint} bodyClassName="p-0">
        <TeamBody
          error={error}
          loading={loading}
          members={members}
          onRetry={() => void load()}
          compact
        />
      </OverviewPanel>
    );
  }

  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <div className="mb-4 flex items-center gap-2">
        <Users size={18} className="text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold">Product team (access)</h3>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">{hint}</p>
      <TeamBody
        error={error}
        loading={loading}
        members={members}
        onRetry={() => void load()}
        compact={false}
      />
    </section>
  );
}

function TeamBody({
  error,
  loading,
  members,
  onRetry,
  compact,
}: {
  error: string | null;
  loading: boolean;
  members: ProductTeamMemberRow[];
  onRetry: () => void;
  compact: boolean;
}) {
  if (error) {
    return (
      <div className={compact ? 'p-4' : undefined}>
        <ErrorState description={error} onRetry={onRetry} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={compact ? 'p-4' : undefined}>
        <LoadingState count={compact ? 2 : 3} />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div
        className={
          compact ? 'text-muted-foreground flex items-center gap-3 px-4 py-5 text-sm' : undefined
        }
      >
        {compact ? (
          <>
            <Users className="size-8 shrink-0 opacity-30" aria-hidden />
            <div className="text-left">
              <p className="text-foreground text-sm font-medium">No product team yet</p>
              <p className="text-xs">Assign delivery roles on this product to populate the team.</p>
            </div>
          </>
        ) : (
          <EmptyState
            icon={Users}
            title="No product team yet"
            description="Assign delivery roles on this product to populate the team."
          />
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className={compact ? 'hover:bg-transparent' : undefined}>
          <TableHead className={compact ? 'h-8 text-xs' : undefined}>Name</TableHead>
          <TableHead className={compact ? 'h-8 w-24 text-xs' : 'w-28'}>Slot</TableHead>
          <TableHead className={compact ? 'h-8 w-20 text-xs' : 'w-24'}>Access</TableHead>
          <TableHead className={compact ? 'h-8 w-28 text-xs' : 'w-32'}>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((row) => (
          <TableRow key={row.id} className={compact ? 'hover:bg-muted/30' : undefined}>
            <TableCell className={compact ? 'py-2 text-xs' : undefined}>
              <span className="font-medium">
                {row.employee.firstName} {row.employee.lastName}
              </span>
              <span className="text-muted-foreground block text-[11px]">{row.employee.email}</span>
            </TableCell>
            <TableCell className={compact ? 'py-2 text-xs' : undefined}>
              <span className="capitalize">{formatProductSlot(row.slot)}</span>
              {row.isPrimary && row.slot ? (
                <Badge variant="outline" className="ml-1 text-[10px]">
                  primary
                </Badge>
              ) : null}
            </TableCell>
            <TableCell className={compact ? 'py-2 text-xs' : undefined}>
              {row.accessLevel}
            </TableCell>
            <TableCell
              className={
                compact
                  ? 'text-muted-foreground py-2 text-xs capitalize'
                  : 'text-muted-foreground text-sm capitalize'
              }
            >
              {formatTeamSource(row.source)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
