'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHero,
  IntegratedSearchFilters,
  ViewModeSwitch,
  EmptyState,
  ErrorState,
  LoadingState,
  NAVIGABLE_ENTITY_CARD_GRID_CLASS,
} from '@/components/shared';
import {
  PARTNER_LEVELS,
  PARTNER_DIRECTIONS,
  PARTNER_STATUSES,
} from '@/features/partners/constants/partners';
import {
  PARTNERS_DIRECTORY_VIEW_OPTIONS,
  type PartnersDirectoryViewMode,
} from '@/features/partners/constants/partners-directory-view-options';
import { CreatePartnerDialog } from '@/features/partners/components/CreatePartnerDialog';
import { PartnerCard } from '@/features/partners/components/PartnerCard';
import { PartnerDetailSheet } from '@/features/partners/components/PartnerDetailSheet';
import { PartnersPageSettingsSheet } from '@/features/partners/components/PartnersPageSettingsSheet';
import { PartnersTable } from '@/features/partners/components/PartnersTable';
import { usePartnersCsvExport } from '@/features/partners/components/use-partners-csv-export';
import { usePartnersScopeStatsCsvExport } from '@/features/partners/components/use-partners-scope-stats-csv-export';
import { buildPartnerListApiParams } from '@/features/partners/utils/build-partner-list-api-params';
import {
  partnersApi,
  type Partner,
  type PartnerListParams,
  type PartnerStats,
} from '@/lib/api/partners';
import { getApiErrorMessage } from '@/lib/api-errors';
import { PARTNER_OPEN_QUERY } from '@/features/partners/constants/partner-open-query';
import { useListScope } from '@/hooks/use-list-scope';
import { toast } from 'sonner';

const PARTNERS_LIST_PAGE_SIZE = 100;

function PartnersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openPartnerId = searchParams.get(PARTNER_OPEN_QUERY)?.trim() || null;
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<PartnersDirectoryViewMode>('grid');
  const [createOpen, setCreateOpen] = useState(false);

  const closePartnerSheetOnScopeChange = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete(PARTNER_OPEN_QUERY);
    const qs = p.toString();
    router.push(qs ? `/partners?${qs}` : '/partners');
  }, [router, searchParams]);

  const { scope, setScope, isTrashView } = useListScope({
    onScopeChange: closePartnerSheetOnScopeChange,
  });

  const partnerListExportParams: Omit<PartnerListParams, 'page' | 'pageSize'> = useMemo(
    () => buildPartnerListApiParams({ search, filters, scope }),
    [search, filters, scope],
  );

  const { exportCsvSubmitting, handleExportCsv } = usePartnersCsvExport(partnerListExportParams);
  const { handleExportScopeStatsCsv } = usePartnersScopeStatsCsvExport(stats);

  const closePartnerSheet = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete(PARTNER_OPEN_QUERY);
    const qs = p.toString();
    router.push(qs ? `/partners?${qs}` : '/partners');
  }, [router, searchParams]);

  const openPartnerSheet = useCallback(
    (partner: Partner) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set(PARTNER_OPEN_QUERY, partner.id);
      router.push(`/partners?${p.toString()}`);
    },
    [router, searchParams],
  );

  const handlePartnerUpdatedFromSheet = useCallback((updated: Partner) => {
    setPartners((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
  }, []);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params: PartnerListParams = {
        page: 1,
        pageSize: PARTNERS_LIST_PAGE_SIZE,
        ...buildPartnerListApiParams({ search, filters, scope }),
      };
      const [listRes, statsRes] = await Promise.all([
        partnersApi.getAll(params),
        partnersApi.getStats(),
      ]);
      setPartners(listRes.items);
      setStats(statsRes);
      setError(null);
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          'Partners could not be loaded. Check your connection and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [search, filters, scope]);

  const handleMoveToTrash = useCallback(
    async (id: string) => {
      await partnersApi.moveToTrash(id);
      toast.success('Partner moved to Trash');
      closePartnerSheet();
      await fetchPartners();
    },
    [closePartnerSheet, fetchPartners],
  );

  const handleRestore = useCallback(
    async (id: string) => {
      const restored = await partnersApi.restore(id);
      toast.success('Partner restored');
      setPartners((prev) => prev.map((x) => (x.id === restored.id ? restored : x)));
      await fetchPartners();
    },
    [fetchPartners],
  );

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const filterConfigs = useMemo(
    () => [
      {
        key: 'level',
        label: 'Level',
        options: PARTNER_LEVELS.map((t) => ({ value: t.value, label: t.label })),
      },
      {
        key: 'direction',
        label: 'Direction',
        options: PARTNER_DIRECTIONS.map((d) => ({ value: d.value, label: d.label })),
      },
      {
        key: 'status',
        label: 'Status',
        options: PARTNER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
      },
    ],
    [],
  );

  const summary = stats ?? {
    total: 0,
    totalSubscriptions: 0,
    avgPayoutPercent: 0,
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Partners"
        search={
          <IntegratedSearchFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search partners…"
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onClearAll={() => setFilters({})}
          />
        }
        viewMode={
          <ViewModeSwitch
            value={view}
            onChange={setView}
            options={PARTNERS_DIRECTORY_VIEW_OPTIONS}
          />
        }
        trailing={
          <>
            <PartnersPageSettingsSheet
              listScope={scope}
              onListScopeChange={setScope}
              exportDisabled={loading || exportCsvSubmitting}
              exportInProgress={exportCsvSubmitting}
              statsExportDisabled={loading || !stats}
              onExportCsv={handleExportCsv}
              onExportScopeStatsCsv={handleExportScopeStatsCsv}
            />
            {!isTrashView ? (
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus size={16} aria-hidden />
                Add Partner
              </Button>
            ) : null}
          </>
        }
      />

      <CreatePartnerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchPartners}
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total partners</p>
          <p className="mt-1 text-xl font-bold">{summary.total}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Linked subscriptions</p>
          <p className="mt-1 text-xl font-bold">{summary.totalSubscriptions}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Avg default %</p>
          <p className="mt-1 text-xl font-bold">{summary.avgPayoutPercent.toFixed(1)}%</p>
        </div>
      </div>

      {loading ? (
        <LoadingState
          variant={view === 'grid' ? 'cards' : 'list'}
          count={view === 'grid' ? 6 : 5}
        />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchPartners} />
      ) : partners.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={isTrashView ? 'Trash is empty' : 'No partners yet'}
          description={
            isTrashView
              ? 'Removed partners will appear here until restored or purged.'
              : 'Start building your partner network'
          }
          action={
            isTrashView ? undefined : (
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> Add First Partner
              </Button>
            )
          }
        />
      ) : view === 'grid' ? (
        <div className={NAVIGABLE_ENTITY_CARD_GRID_CLASS}>
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} onOpen={openPartnerSheet} />
          ))}
        </div>
      ) : (
        <PartnersTable partners={partners} onOpen={openPartnerSheet} />
      )}

      <PartnerDetailSheet
        partnerId={openPartnerId}
        initialPartner={partners.find((partner) => partner.id === openPartnerId) ?? null}
        open={Boolean(openPartnerId)}
        onOpenChange={(next) => {
          if (!next) closePartnerSheet();
        }}
        onPartnerUpdated={handlePartnerUpdatedFromSheet}
        isTrashView={isTrashView}
        onMoveToTrash={isTrashView ? undefined : handleMoveToTrash}
        onRestore={isTrashView ? handleRestore : undefined}
      />
    </div>
  );
}

export default function PartnersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PartnersPageContent />
    </Suspense>
  );
}
