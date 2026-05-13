'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/shared';
import {
  portfolioApi,
  type ClientHealth,
  type CompanyPortfolioResponse,
  type ContactPortfolioResponse,
  type PortfolioAccessMask,
} from '@/lib/api/client-portfolio';
import {
  clientPortfolioCompanyPath,
  clientPortfolioContactPath,
} from '../../constants/client-routes';
import { cn } from '@/lib/utils';
import { ClientPortfolioTabPanels, type ClientPortfolioTabId } from './ClientPortfolioTabPanels';

const ALL_PORTFOLIO_TABS: ReadonlyArray<{ id: ClientPortfolioTabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'finance', label: 'Finance' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'support', label: 'Support' },
  { id: 'communication', label: 'Communication' },
  { id: 'files', label: 'Files' },
];

function portfolioTabsForMask(mask: PortfolioAccessMask) {
  return ALL_PORTFOLIO_TABS.filter((t) => {
    if (t.id === 'overview' || t.id === 'projects') return true;
    if (t.id === 'finance') return mask.finance;
    if (t.id === 'subscriptions') return mask.subscriptions;
    if (t.id === 'support') return mask.support;
    if (t.id === 'communication') return mask.communication;
    if (t.id === 'files') return mask.files;
    return true;
  });
}

function healthVariant(h: ClientHealth): 'green' | 'amber' | 'red' {
  if (h === 'good') return 'green';
  if (h === 'warning') return 'amber';
  return 'red';
}

function healthLabel(h: ClientHealth): string {
  if (h === 'good') return 'Good';
  if (h === 'warning') return 'Warning';
  return 'Risk';
}

interface ClientPortfolioViewProps {
  variant: 'contact' | 'company';
  entityId: string;
  asSheet?: boolean;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}

export function ClientPortfolioView({
  variant,
  entityId,
  asSheet = false,
  sheetOpen = true,
  onSheetOpenChange,
}: ClientPortfolioViewProps) {
  const [tab, setTab] = useState<ClientPortfolioTabId>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ContactPortfolioResponse | CompanyPortfolioResponse | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res =
        variant === 'contact'
          ? await portfolioApi.getByContact(entityId)
          : await portfolioApi.getByCompany(entityId);
      setData(res);
    } catch {
      setError('Portfolio could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [variant, entityId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleTabs = useMemo(
    () => (data ? portfolioTabsForMask(data.accessMask) : ALL_PORTFOLIO_TABS),
    [data],
  );

  useEffect(() => {
    if (!data) return;
    const allowed = new Set(visibleTabs.map((t) => t.id));
    if (!allowed.has(tab)) setTab('overview');
  }, [data, tab, visibleTabs]);

  const title =
    variant === 'contact' && data && data.scope === 'contact'
      ? `${(data.contact as { firstName?: string }).firstName ?? ''} ${(data.contact as { lastName?: string }).lastName ?? ''}`.trim()
      : data && data.scope === 'company'
        ? String((data.company as { name?: string }).name ?? 'Company')
        : 'Client Portfolio';

  const backHref = variant === 'contact' ? '/clients/contacts' : '/clients/companies';

  const inner = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-border flex shrink-0 flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={backHref}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                '-ml-2 inline-flex items-center gap-1.5',
              )}
            >
              <ArrowLeft size={14} />
              Clients
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {data && (
              <StatusBadge
                label={healthLabel(data.clientHealth)}
                variant={healthVariant(data.clientHealth)}
              />
            )}
            <StatusBadge label={variant === 'contact' ? 'Contact' : 'Company'} variant="blue" />
          </div>
          <p className="text-muted-foreground max-w-2xl text-xs">
            Computed client portfolio (NBOS). Tabs and financial detail follow your role and module
            permissions.
          </p>
        </div>
        <Link
          href={
            variant === 'contact'
              ? clientPortfolioContactPath(entityId)
              : clientPortfolioCompanyPath(entityId)
          }
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'inline-flex items-center gap-1.5',
          )}
        >
          <LayoutDashboard size={14} />
          Permalink
        </Link>
      </div>

      <div className="border-border flex shrink-0 gap-1 overflow-x-auto border-b px-4 py-2">
        {visibleTabs.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={tab === t.id ? 'default' : 'ghost'}
            className="shrink-0 rounded-lg"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 px-6 py-5">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}
          {error && <p className="text-destructive text-sm">{error}</p>}
          {!loading && !error && data && (
            <ClientPortfolioTabPanels tab={tab} data={data} variant={variant} onRetry={load} />
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (asSheet) {
    return (
      <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          floatingClose
          className="flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[80vw]"
        >
          {inner}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="bg-background flex h-full min-h-0 flex-col rounded-xl border">{inner}</div>
  );
}
