'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, GitBranch, RefreshCcw } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  useModuleHeroSlots,
} from '@/components/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { marketingApi } from '@/lib/api/marketing';
import type { Deal } from '@/lib/api/deals';
import type { Lead } from '@/lib/api/leads';

interface AttributionReview {
  leads: Lead[];
  deals: Deal[];
}

export default function AttributionReviewPage() {
  const [review, setReview] = useState<AttributionReview>({ leads: [], deals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void fetchReview();
  }, [fetchReview]);

  const moduleHeroSlots = useMemo(
    () => ({
      trailing: (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/crm/leads"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'inline-flex items-center gap-1.5',
            )}
          >
            Leads pipeline
            <ExternalLink className="size-3 shrink-0" aria-hidden />
          </Link>
          <Link
            href="/crm/deals"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'inline-flex items-center gap-1.5',
            )}
          >
            Deals pipeline
            <ExternalLink className="size-3 shrink-0" aria-hidden />
          </Link>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => void fetchReview()}
            aria-label="Refresh review"
          >
            <RefreshCcw size={16} aria-hidden />
          </Button>
        </div>
      ),
    }),
    [fetchReview],
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
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ReviewColumn
            title="Leads"
            items={review.leads}
            kind="Lead"
            hrefFor={(item) => `/crm/leads?openLeadId=${encodeURIComponent(item.id)}`}
          />
          <ReviewColumn
            title="Deals"
            items={review.deals}
            kind="Deal"
            hrefFor={(item) => `/crm/deals?openDealId=${encodeURIComponent(item.id)}`}
          />
        </div>
      )}
    </div>
  );
}

function ReviewColumn({
  title,
  items,
  kind,
  hrefFor,
}: {
  title: string;
  items: Array<Lead | Deal>;
  kind: string;
  hrefFor: (item: Lead | Deal) => string;
}) {
  return (
    <section className="border-border bg-card rounded-2xl border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <StatusBadge
          label={`${items.length} issues`}
          variant={items.length > 0 ? 'amber' : 'green'}
        />
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border-border rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {'contactName' in item ? item.contactName : item.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {kind} · {item.code} · {item.source ?? 'Missing source'}
                </p>
              </div>
              <StatusBadge label={item.status.replace(/_/g, ' ')} variant="blue" />
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{describeIssue(item)}</p>
            <Link
              href={hrefFor(item)}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'mt-3 inline-flex w-full items-center gap-1.5 sm:w-auto',
              )}
            >
              Open in CRM
              <ExternalLink className="size-3 shrink-0" aria-hidden />
            </Link>
          </div>
        ))}
      </div>
    </section>
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
