'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Copy, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MetaAccountList } from '@/features/integrations/components/MetaAccountList';
import { MetaConnectSheet } from '@/features/integrations/components/MetaConnectSheet';
import { resolveMetaOAuthErrorPresentation } from '@/features/integrations/meta-oauth-error-messages';
import { marketingApi, type MarketingAccount } from '@/lib/api/marketing';
import { metaIntegrationApi, type MetaConnectedAccount } from '@/lib/api/meta-integration';
import { getApiErrorMessage } from '@/lib/api-errors';
import { PermissionGate } from '@/lib/permissions/PermissionGate';

export function MetaIntegrationsSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<MetaConnectedAccount[]>([]);
  const [marketingAccounts, setMarketingAccounts] = useState<MarketingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [oauthHandled, setOauthHandled] = useState(false);
  const [oauthErrorDetails, setOauthErrorDetails] = useState<{
    message: string;
    reason: string;
    errorId: string | null;
  } | null>(null);

  const loadMeta = useCallback(async () => {
    setLoading(true);
    try {
      const [metaRows, smmAccounts] = await Promise.all([
        metaIntegrationApi.listAccounts(),
        marketingApi.getAccounts({ channel: 'SMM', status: 'ACTIVE' }),
      ]);
      setAccounts(metaRows);
      setMarketingAccounts(smmAccounts);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Meta integrations could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (oauthHandled) {
      return;
    }
    const oauthStatus = searchParams.get('oauth');
    if (!oauthStatus) {
      return;
    }
    setOauthHandled(true);
    const reason = searchParams.get('reason');
    const errorId = searchParams.get('error_id');
    if (oauthStatus === 'success') {
      toast.success(
        'Meta account connected. Link a Marketing account (SMM) to enable Lead creation.',
      );
      void loadMeta();
    } else if (oauthStatus === 'error') {
      const presentation = resolveMetaOAuthErrorPresentation(reason, errorId);
      setOauthErrorDetails(presentation);
      toast.error(presentation.message);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('oauth');
    params.delete('reason');
    params.delete('error_id');
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  }, [oauthHandled, searchParams, pathname, router, loadMeta]);

  const copyErrorId = async (errorId: string) => {
    try {
      await navigator.clipboard.writeText(errorId);
      toast.success('Technical reference copied.');
    } catch {
      toast.error('Could not copy technical reference.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Channel connections</h2>
        <p className="text-muted-foreground text-sm">
          Connect external channels. Meta DMs create CRM Leads when a Marketing account is linked.
        </p>
      </div>

      {oauthErrorDetails ? (
        <MetaOAuthErrorPanel
          details={oauthErrorDetails}
          onCopyErrorId={(id) => void copyErrorId(id)}
          onDismiss={() => setOauthErrorDetails(null)}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <MetaProviderCard
          title="Instagram"
          description="Instagram Direct → CRM Lead (via Meta)"
          icon={Instagram}
          actionLabel="Connect"
          onConnect={() => setConnectOpen(true)}
          loading={loading}
        />
        <MetaProviderCard
          title="Facebook"
          description="Facebook Messenger → CRM Lead (via Meta)"
          icon={Facebook}
          actionLabel="Connect"
          onConnect={() => setConnectOpen(true)}
          loading={loading}
        />
        <PlaceholderProviderCard
          title="ATS"
          description="Applicant tracking integrations — coming soon."
        />
        <PlaceholderProviderCard
          title="WhatsApp"
          description="WhatsApp Gateway integration — coming soon."
          icon={MessageCircle}
        />
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Connected Meta accounts</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => void loadMeta()}>
            Refresh
          </Button>
        </div>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading Meta accounts…</p>
        ) : (
          <MetaAccountList
            accounts={accounts}
            marketingAccounts={marketingAccounts}
            onChanged={() => void loadMeta()}
          />
        )}
      </section>

      <Sheet open={connectOpen} onOpenChange={setConnectOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <MetaConnectSheet onClose={() => setConnectOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface MetaOAuthErrorPanelProps {
  details: {
    message: string;
    reason: string;
    errorId: string | null;
  };
  onCopyErrorId: (errorId: string) => void;
  onDismiss: () => void;
}

function MetaOAuthErrorPanel({ details, onCopyErrorId, onDismiss }: MetaOAuthErrorPanelProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <section
      className="rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900 dark:bg-red-950/20"
      role="alert"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-red-900 dark:text-red-100">{details.message}</p>
          {details.errorId ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-red-800 dark:text-red-200">
              <span>
                Technical reference: <span className="font-mono">{details.errorId}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={() => onCopyErrorId(details.errorId!)}
              >
                <Copy size={12} aria-hidden />
                Copy
              </Button>
            </div>
          ) : null}
          <PermissionGate module="COMPANY" action="EDIT">
            <div className="space-y-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setShowTechnical((open) => !open)}
              >
                {showTechnical ? 'Hide technical details' : 'Show technical details'}
              </Button>
              {showTechnical ? (
                <dl className="grid gap-1 text-xs text-red-800 dark:text-red-200">
                  <div className="flex gap-2">
                    <dt className="font-medium">Reason code:</dt>
                    <dd className="font-mono">{details.reason}</dd>
                  </div>
                  {details.errorId ? (
                    <div className="flex gap-2">
                      <dt className="font-medium">Error ID:</dt>
                      <dd className="font-mono">{details.errorId}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </div>
          </PermissionGate>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </section>
  );
}

interface MetaProviderCardProps {
  title: string;
  description: string;
  icon: typeof Instagram;
  actionLabel: string;
  onConnect: () => void;
  loading: boolean;
}

function MetaProviderCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  onConnect,
  loading,
}: MetaProviderCardProps) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start gap-3">
        <Icon size={20} className="text-foreground mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
          <Button type="button" size="sm" className="mt-3" disabled={loading} onClick={onConnect}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}

function PlaceholderProviderCard({
  title,
  description,
  icon: Icon = MessageCircle,
}: {
  title: string;
  description: string;
  icon?: typeof MessageCircle;
}) {
  return (
    <section className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-4 dark:border-stone-700 dark:bg-stone-950/20">
      <div className="flex items-start gap-3 opacity-70">
        <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
          <Button type="button" size="sm" className="mt-3" disabled>
            Coming soon
          </Button>
        </div>
      </div>
    </section>
  );
}
