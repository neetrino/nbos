'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MetaAccountList } from '@/features/integrations/components/MetaAccountList';
import { MetaConnectSheet } from '@/features/integrations/components/MetaConnectSheet';
import { marketingApi, type MarketingAccount } from '@/lib/api/marketing';
import { metaIntegrationApi, type MetaConnectedAccount } from '@/lib/api/meta-integration';
import { getApiErrorMessage } from '@/lib/api-errors';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Meta authorization was incomplete. No account was connected.',
  access_denied: 'Meta access was denied. Account was not connected.',
  invalid_state: 'Meta authorization expired. Please try connecting again.',
  token_exchange_failed: 'Meta token exchange failed. Check app credentials.',
  instagram_token_exchange_failed:
    'Instagram authorization could not be completed. Check the Instagram app credentials and try again.',
  instagram_long_lived_token_failed:
    'Instagram authorization could not be completed. Please try connecting again.',
  instagram_profile_failed:
    'Instagram account information could not be loaded. Please reconnect the account.',
  instagram_callback_failed: 'Instagram connection failed. Please try again.',
  missing_pages: 'No Facebook Pages were found for this Meta account.',
  not_configured: 'Meta integration is not configured on the server.',
  unknown: 'Meta connection failed. Please try again.',
};

export function MetaIntegrationsSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<MetaConnectedAccount[]>([]);
  const [marketingAccounts, setMarketingAccounts] = useState<MarketingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [oauthHandled, setOauthHandled] = useState(false);

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
    if (oauthStatus === 'success') {
      toast.success(
        'Meta account connected. Link a Marketing account (SMM) to enable Lead creation.',
      );
      void loadMeta();
    } else if (oauthStatus === 'error') {
      toast.error(OAUTH_ERROR_MESSAGES[reason ?? 'unknown'] ?? OAUTH_ERROR_MESSAGES.unknown);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('oauth');
    params.delete('reason');
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  }, [oauthHandled, searchParams, pathname, router, loadMeta]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Channel connections</h2>
        <p className="text-muted-foreground text-sm">
          Connect external channels. Meta DMs create CRM Leads when a Marketing account is linked.
        </p>
      </div>

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
