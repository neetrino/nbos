'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DataView,
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
  EmptyState,
  ErrorState,
  ListMutationErrorBanner,
  LoadingState,
  PersonContactRow,
  PersonSoftAvatar,
} from '@/components/shared';
import {
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';
import { PERSON_OVERVIEW_GRID_CLASS } from '@/components/shared/person-contact-row.constants';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { platformAccessApi, type ProductTeamMemberRow } from '@/lib/api/platform-access';
import { cn } from '@/lib/utils';
import { formatProductSlot, formatTeamSource } from '../team-member-labels';

interface ProductParticipantsSectionProps {
  productId: string;
  /** Inside {@link ProductInfoPanel} — minimal rows, no card chrome. */
  embedded?: boolean;
  className?: string;
}

function memberDisplayName(row: ProductTeamMemberRow): string {
  return `${row.employee.firstName} ${row.employee.lastName}`.trim();
}

function ProductTeamMemberChip({ row }: { row: ProductTeamMemberRow }) {
  const relations = useEntityRelations();
  const hasSlot = Boolean(row.slot);
  const slotLabel = formatProductSlot(row.slot);

  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
      {hasSlot ? (
        <span className={cn(DETAIL_SHEET_OUTLINED_LABEL_CLASS, 'capitalize')}>{slotLabel}</span>
      ) : null}
      <PersonContactRow
        name={memberDisplayName(row)}
        email={row.employee.email}
        imageUrl={row.employee.avatar}
        onOpen={() => relations.openEntity('employee', row.employee.id)}
        trailing={
          row.isPrimary && hasSlot ? (
            <Badge variant="outline" className="text-[10px]">
              primary
            </Badge>
          ) : null
        }
      />
    </div>
  );
}

export function ProductParticipantsSection({
  productId,
  embedded = false,
  className,
}: ProductParticipantsSectionProps) {
  const [members, setMembers] = useState<ProductTeamMemberRow[]>([]);
  const membersRef = useRef(members);
  membersRef.current = members;
  const loadedProductIdRef = useRef<string | null>(null);
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null);
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    beginLoad(loadedProductIdRef.current === productId && membersRef.current.length > 0);
    setError(null);
    try {
      const res = await platformAccessApi.listProductTeam(productId);
      setMembers(Array.isArray(res.data) ? res.data : []);
      loadedProductIdRef.current = productId;
      setLoadedProductId(productId);
    } catch (err) {
      if (isAccessRevokedApiError(err) || loadedProductIdRef.current !== productId) {
        setMembers([]);
        loadedProductIdRef.current = null;
        setLoadedProductId(null);
      }
      setError(getApiErrorMessage(err, 'Failed to load product team'));
    } finally {
      endLoad();
    }
  }, [beginLoad, endLoad, productId]);

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
          loadedProductId={loadedProductId}
          productId={productId}
          onRetry={() => void load()}
          onDismissError={() => setError(null)}
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
  loadedProductId,
  productId,
  onRetry,
  onDismissError,
  embedded,
}: {
  error: string | null;
  loading: boolean;
  members: ProductTeamMemberRow[];
  loadedProductId: string | null;
  productId: string;
  onRetry: () => void;
  onDismissError: () => void;
  embedded: boolean;
}) {
  const relations = useEntityRelations();
  return (
    <DataView
      loading={loading}
      error={error}
      hasData={loadedProductId === productId && members.length > 0}
      loadingFallback={<LoadingState count={embedded ? 2 : 3} />}
      errorFallback={<ErrorState description={error ?? ''} onRetry={onRetry} />}
      emptyFallback={
        embedded ? (
          <p className="text-muted-foreground text-xs">
            No product team yet. Assign delivery roles on this product to populate the team.
          </p>
        ) : (
          <EmptyState
            icon={Users}
            title="No product team yet"
            description="Assign delivery roles on this product to populate the team."
          />
        )
      }
    >
      {error ? <ListMutationErrorBanner message={error} onDismiss={onDismissError} /> : null}
      {embedded ? (
        <div className={PERSON_OVERVIEW_GRID_CLASS}>
          {members.map((row) => (
            <ProductTeamMemberChip key={row.id} row={row} />
          ))}
        </div>
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
            {members.map((row) => {
              const name = memberDisplayName(row);
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-3 text-left"
                      onClick={() => relations.openEntity('employee', row.employee.id)}
                    >
                      <PersonSoftAvatar
                        name={name}
                        imageUrl={row.employee.avatar}
                        className="size-8 text-[10px]"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">{name}</span>
                        <span className="text-muted-foreground block text-xs">
                          {row.employee.email}
                        </span>
                      </span>
                    </button>
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
              );
            })}
          </TableBody>
        </Table>
      )}
    </DataView>
  );
}
