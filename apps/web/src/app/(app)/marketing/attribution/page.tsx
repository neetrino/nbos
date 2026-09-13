'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GitBranch, Handshake, Megaphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { buildAttributionStatusOptions } from '@/features/marketing/constants/marketing-attribution-filters';
import { matchesMarketingSearch } from '@/features/marketing/utils/matches-marketing-search';
import { resolveAttributionStatusLabel } from '@/features/marketing/i18n/marketing-copy';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilterField } from '@/lib/persisted-client-state';

type AttributionEntityTab = 'leads' | 'deals';

interface AttributionReview {
  leads: Lead[];
  deals: Deal[];
}

export default function AttributionReviewPage() {
  const t = useTranslations('marketing');
  const tCrm = useTranslations('crm');
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
      setError(t('attribution.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
    return buildAttributionStatusOptions(statuses, tCrm);
  }, [activeTab, review, tCrm]);

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
        resolveAttributionStatusLabel(tCrm, item.status),
      );
    };
    return {
      leads: review.leads.filter(filterItem),
      deals: review.deals.filter(filterItem),
    };
  }, [review, search, statusFilter, tCrm]);

  const activeItems = activeTab === 'leads' ? filteredReview.leads : filteredReview.deals;
  const activeTotal = activeTab === 'leads' ? review.leads.length : review.deals.length;

  const tabOptions = useMemo(
    () => [
      {
        value: 'leads' as const,
        label: `${t('attribution.leads')} (${review.leads.length})`,
        icon: Megaphone,
      },
      {
        value: 'deals' as const,
        label: `${t('attribution.deals')} (${review.deals.length})`,
        icon: Handshake,
      },
    ],
    [review.deals.length, review.leads.length, t],
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
          ariaLabel={t('attribution.entityAria')}
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
            aria-label={t('attribution.dealsPipelineAria')}
          >
            <Handshake size={16} aria-hidden />
            {t('attribution.deals')}
          </Link>
          <Link
            href="/crm/leads"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-10 gap-1.5 px-3')}
            aria-label={t('attribution.leadsPipelineAria')}
          >
            <Megaphone size={16} aria-hidden />
            {t('attribution.leads')}
          </Link>
        </div>
      ),
    }),
    [activeTab, search, setStatusFilter, statusFilter, statusOptions, tabOptions, t],
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
          title={t('attribution.cleanTitle')}
          description={t('attribution.cleanDescription')}
        />
      ) : activeTotal === 0 ? (
        <EmptyState
          icon={activeTab === 'leads' ? Megaphone : Handshake}
          title={
            activeTab === 'leads'
              ? t('attribution.noLeadIssuesTitle')
              : t('attribution.noDealIssuesTitle')
          }
          description={
            activeTab === 'leads' ? t('attribution.checkDealsTab') : t('attribution.checkLeadsTab')
          }
        />
      ) : activeItems.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title={t('attribution.noMatchTitle')}
          description={t('attribution.noMatchDescription')}
        />
      ) : (
        <ReviewList
          items={activeItems}
          kind={activeTab === 'leads' ? 'Lead' : 'Deal'}
          cardsPerRow={2}
          onOpenItem={handleOpenItem}
          describeIssue={describeIssue}
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
  describeIssue,
}: {
  items: Array<Lead | Deal>;
  kind: 'Lead' | 'Deal';
  onOpenItem: (item: Lead | Deal) => void;
  cardsPerRow?: 1 | 2;
  describeIssue: (item: Lead | Deal, t: ReturnType<typeof useTranslations<'marketing'>>) => string;
}) {
  const t = useTranslations('marketing');

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
          issueDescription={describeIssue(item, t)}
          onOpen={onOpenItem}
        />
      ))}
    </div>
  );
}

function describeIssue(
  item: Lead | Deal,
  t: ReturnType<typeof useTranslations<'marketing'>>,
): string {
  if (!item.source) return t('attribution.issues.fromMissing');
  if (item.source === 'MARKETING' && !item.sourceDetail)
    return t('attribution.issues.whereMissing');
  if (item.source === 'MARKETING') return t('attribution.issues.whichOneMissing');
  if (item.source === 'PARTNER') return t('attribution.issues.partnerMissing');
  if (item.source === 'CLIENT') return t('attribution.issues.clientMissing');
  return t('attribution.issues.needsReview');
}
