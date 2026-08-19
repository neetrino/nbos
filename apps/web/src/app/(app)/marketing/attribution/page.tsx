'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GitBranch, Handshake, Megaphone } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeroTabs,
  useModuleHeroSlots,
} from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { marketingApi } from '@/lib/api/marketing';
import type { Deal } from '@/lib/api/deals';
import type { Lead } from '@/lib/api/leads';
import { EntityLeadSheetDeepLink } from '@/features/crm/components/EntityLeadSheetDeepLink';
import { AttributionHeroSearch } from '@/features/marketing/components/AttributionHeroSearch';
import { AttributionReviewCard } from '@/features/marketing/components/AttributionReviewCard';
import {
  buildAttributionStatusOptions,
  resolveAttributionStatusLabel,
} from '@/features/marketing/constants/marketing-attribution-filters';
import { matchesMarketingSearch } from '@/features/marketing/utils/matches-marketing-search';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilterField } from '@/lib/persisted-client-state';

type AttributionEntityTab = 'leads' | 'deals';

interface AttributionReview {
  leads: Lead[];
  deals: Deal[];
}

const ATTRIBUTION_ENTITY_TABS = [
  { value: 'leads' as const, label: 'Leads', icon: Megaphone },
  { value: 'deals' as const, label: 'Deals', icon: Handshake },
];

export default function AttributionReviewPage() {
  const [review, setReview] = useState<AttributionReview>({ leads: [], deals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = usePersistedSearchFilterField(
    SEARCH_FILTER_PAGE_ID.marketingAttribution,
    'status',
    '',
  );
  const [activeTab, setActiveTab] = useState<AttributionEntityTab>('leads');
  const [openLead, setOpenLead] = useState<Lead | null>(null);
  const [openDeal, setOpenDeal] = useState<Deal | null>(null);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    try {
      setReview((await marketingApi.getAttributionReview()) as AttributionReview);
      setError(null);
    } catch {
      setError('Attribution review could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshReviewQuiet = useCallback(async () => {
    try {
      setReview((await marketingApi.getAttributionReview()) as AttributionReview);
      setError(null);
    } catch {
      // Keep the current list if background refresh fails.
    }
  }, []);

  useEffect(() => {
    void fetchReview();
  }, [fetchReview]);

  const statusOptions = useMemo(() => {
    const statuses =
      activeTab === 'leads'
        ? review.leads.map((lead) => lead.status)
        : review.deals.map((deal) => deal.status);
    return buildAttributionStatusOptions(statuses);
  }, [activeTab, review]);

  useEffect(() => {
    if (!statusFilter) return;
    if (!statusOptions.some((option) => option.value === statusFilter)) {
      setStatusFilter('');
    }
  }, [setStatusFilter, statusFilter, statusOptions]);

  const filteredReview = useMemo(() => {
    const filterItem = (item: Lead | Deal) => {
      if (statusFilter && item.status !== statusFilter) return false;
      return matchesMarketingSearch(
        search,
        'contactName' in item ? item.contactName : item.name,
        item.code,
        item.source,
        item.sourceDetail,
        resolveAttributionStatusLabel(item.status),
      );
    };
    return {
      leads: review.leads.filter(filterItem),
      deals: review.deals.filter(filterItem),
    };
  }, [review, search, statusFilter]);

  const activeItems = activeTab === 'leads' ? filteredReview.leads : filteredReview.deals;
  const activeTotal = activeTab === 'leads' ? review.leads.length : review.deals.length;

  const tabOptions = useMemo(
    () =>
      ATTRIBUTION_ENTITY_TABS.map((tab) => ({
        ...tab,
        label: `${tab.label} (${tab.value === 'leads' ? review.leads.length : review.deals.length})`,
      })),
    [review.deals.length, review.leads.length],
  );

  const handleOpenItem = useCallback(
    (item: Lead | Deal) => {
      if (activeTab === 'leads') {
        setOpenDeal(null);
        setOpenLead(item as Lead);
        return;
      }
      setOpenLead(null);
      setOpenDeal(item as Deal);
    },
    [activeTab],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      tabs: (
        <PageHeroTabs
          value={activeTab}
          onChange={setActiveTab}
          options={tabOptions}
          ariaLabel="Attribution entity"
        />
      ),
      search: (
        <AttributionHeroSearch
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={statusOptions}
        />
      ),
      trailing: (
        <div className="flex items-center gap-1">
          <Link
            href="/crm/deals"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-10 gap-1.5 px-3')}
            aria-label="Deals pipeline"
          >
            <Handshake size={16} aria-hidden />
            Deals
          </Link>
          <Link
            href="/crm/leads"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-10 gap-1.5 px-3')}
            aria-label="Leads pipeline"
          >
            <Megaphone size={16} aria-hidden />
            Leads
          </Link>
        </div>
      ),
    }),
    [activeTab, search, setStatusFilter, statusFilter, statusOptions, tabOptions],
  );

  useModuleHeroSlots(moduleHeroSlots);

  const totalIssues = review.leads.length + review.deals.length;

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingState variant="list" count={5} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchReview} />
      ) : totalIssues === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="Attribution is clean"
          description="No leads or deals currently need manual source cleanup."
        />
      ) : activeTotal === 0 ? (
        <EmptyState
          icon={activeTab === 'leads' ? Megaphone : Handshake}
          title={
            activeTab === 'leads' ? 'No lead attribution issues' : 'No deal attribution issues'
          }
          description={
            activeTab === 'leads'
              ? 'Leads look clean. Check the Deals tab for remaining issues.'
              : 'Deals look clean. Check the Leads tab for remaining issues.'
          }
        />
      ) : activeItems.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No matching attribution issues"
          description="Try a different search or status filter."
        />
      ) : (
        <ReviewList
          items={activeItems}
          kind={activeTab === 'leads' ? 'Lead' : 'Deal'}
          cardsPerRow={2}
          onOpenItem={handleOpenItem}
        />
      )}

      <EntityLeadSheetDeepLink
        leadId={openLead?.id ?? null}
        initialLead={openLead}
        open={Boolean(openLead)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setOpenLead(null);
            void refreshReviewQuiet();
          }
        }}
        onEntityChanged={() => void refreshReviewQuiet()}
      />
      <EntityDealSheetDeepLink
        dealId={openDeal?.id ?? null}
        initialDeal={openDeal}
        open={Boolean(openDeal)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setOpenDeal(null);
            void refreshReviewQuiet();
          }
        }}
        onEntityChanged={() => void refreshReviewQuiet()}
      />
    </div>
  );
}

function ReviewList({
  items,
  kind,
  onOpenItem,
  cardsPerRow = 1,
}: {
  items: Array<Lead | Deal>;
  kind: 'Lead' | 'Deal';
  onOpenItem: (item: Lead | Deal) => void;
  cardsPerRow?: 1 | 2;
}) {
  return (
    <div
      className={cn(
        'gap-3',
        cardsPerRow === 2 ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col',
      )}
    >
      {items.map((item) => (
        <AttributionReviewCard
          key={item.id}
          item={item}
          kind={kind}
          issueDescription={describeIssue(item)}
          onOpen={onOpenItem}
        />
      ))}
    </div>
  );
}

function describeIssue(item: Lead | Deal): string {
  if (!item.source) return 'From is missing.';
  if (item.source === 'MARKETING' && !item.sourceDetail) return 'Where is missing.';
  if (item.source === 'MARKETING') return 'Which one is missing for this marketing channel.';
  if (item.source === 'PARTNER') return 'Partner source is missing.';
  if (item.source === 'CLIENT') return 'Client/referral source is missing.';
  return 'Attribution needs review.';
}
