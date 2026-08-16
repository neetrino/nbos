'use client';

import { useState } from 'react';
import { AlertTriangle, Link2, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { marketingApi, type MarketingAccount } from '@/lib/api/marketing';
import { metaIntegrationApi, type MetaConnectedAccount } from '@/lib/api/meta-integration';
import { getApiErrorMessage } from '@/lib/api-errors';

export interface MetaAccountListProps {
  accounts: MetaConnectedAccount[];
  marketingAccounts: MarketingAccount[];
  onChanged: () => void;
}

const PLATFORM_LABEL: Record<MetaConnectedAccount['platform'], string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
};

export function MetaAccountList({ accounts, marketingAccounts, onChanged }: MetaAccountListProps) {
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  if (accounts.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No Meta accounts connected yet. Use Connect to authorize Instagram / Facebook pages.
      </p>
    );
  }

  async function handleLink(accountId: string, marketingAccountId: string) {
    setLinkingId(accountId);
    try {
      await metaIntegrationApi.linkMarketingAccount(accountId, marketingAccountId || null);
      toast.success('Marketing account linked.');
      onChanged();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not link marketing account.'));
    } finally {
      setLinkingId(null);
    }
  }

  async function handleDisconnect(accountId: string) {
    setDisconnectingId(accountId);
    try {
      await metaIntegrationApi.disconnect(accountId);
      toast.success('Meta account disconnected.');
      onChanged();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not disconnect account.'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const needsMarketingLink = !account.marketingAccountId;
        return (
          <div key={account.id} className="border-border bg-muted rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{account.displayName}</p>
                <p className="text-muted-foreground text-xs">
                  {PLATFORM_LABEL[account.platform]} · {account.status}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disconnectingId === account.id}
                onClick={() => void handleDisconnect(account.id)}
              >
                <Unlink size={14} aria-hidden />
                Disconnect
              </Button>
            </div>

            {needsMarketingLink ? (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  Incoming DMs will not create Leads until a Marketing account (SMM channel) is
                  linked.
                </span>
              </div>
            ) : null}

            <div className="mt-3 space-y-1">
              <label
                className="text-muted-foreground flex items-center gap-1 text-xs"
                htmlFor={`marketing-link-${account.id}`}
              >
                <Link2 size={12} aria-hidden />
                Linked Marketing account
              </label>
              <select
                id={`marketing-link-${account.id}`}
                className="border-border bg-background w-full rounded-md border px-2 py-1.5 text-sm"
                value={account.marketingAccountId ?? ''}
                disabled={linkingId === account.id}
                onChange={(event) => void handleLink(account.id, event.target.value)}
              >
                <option value="">— Not linked —</option>
                {marketingAccounts.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                    {row.identifier ? ` (${row.identifier})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {account.lastErrorMessage ? (
              <p className="text-destructive mt-2 text-xs">{account.lastErrorMessage}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
