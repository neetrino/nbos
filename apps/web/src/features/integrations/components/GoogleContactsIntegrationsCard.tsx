'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookUser } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-errors';
import { googleContactsApi, type GoogleContactsConnectionView } from '@/lib/api/google-contacts';
import { usePermission } from '@/lib/permissions';

const CARD_DESCRIPTION =
  'NBOS contacts → one Google account (caller ID / ATS.am # phones). Founder only.';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Google access was denied.',
  missing_code: 'Google did not return an authorization code.',
  invalid_state: 'OAuth session expired. Try Connect again.',
  not_owner: 'Only the platform Founder can connect Google Contacts.',
  token_exchange_failed: 'Google token exchange failed. Try again.',
  missing_refresh_token: 'Google did not return a refresh token. Revoke NBOS access and retry.',
  insufficient_scope: 'Contacts permission was not granted. Connect again and allow Contacts.',
  unknown: 'Google Contacts connection failed.',
};

export function GoogleContactsIntegrationsCard() {
  const { me, isLoading: permissionsLoading } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<GoogleContactsConnectionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [oauthHandled, setOauthHandled] = useState(false);
  const isFounder = me?.isPlatformOwner === true;

  const load = useCallback(async () => {
    if (!isFounder) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await googleContactsApi.getConnection();
      setView(next);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load Google Contacts settings.'));
    } finally {
      setLoading(false);
    }
  }, [isFounder]);

  useEffect(() => {
    if (permissionsLoading) return;
    void load();
  }, [permissionsLoading, load]);

  useEffect(() => {
    if (oauthHandled || permissionsLoading || !isFounder) return;
    const status = searchParams.get('google_contacts');
    if (!status) return;
    setOauthHandled(true);
    if (status === 'connected') {
      toast.success('Google Contacts connected. Active contacts are syncing.');
      void load();
    } else if (status === 'error') {
      const reason = searchParams.get('reason') ?? 'unknown';
      toast.error(OAUTH_ERROR_MESSAGES[reason] ?? OAUTH_ERROR_MESSAGES.unknown);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('google_contacts');
    params.delete('reason');
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  }, [oauthHandled, permissionsLoading, isFounder, searchParams, pathname, router, load]);

  if (permissionsLoading || !isFounder) {
    return null;
  }

  async function connect() {
    setConnecting(true);
    try {
      const { url } = await googleContactsApi.startOAuth();
      window.location.assign(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not start Google Contacts OAuth.'));
      setConnecting(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    try {
      const next = await googleContactsApi.syncNow();
      setView(next);
      const count = next.enqueued ?? 0;
      toast.success(
        count > 0
          ? `Queued ${count} contact${count === 1 ? '' : 's'} for Google sync.`
          : 'No contacts queued (already connected book may be empty or Redis offline).',
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not start Google Contacts sync.'));
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    if (
      !window.confirm('Disconnect Google Contacts? Mappings are kept for a same-email reconnect.')
    ) {
      return;
    }
    try {
      const next = await googleContactsApi.disconnect();
      setView(next);
      toast.success('Google Contacts disconnected.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not disconnect Google Contacts.'));
    }
  }

  const description = loading
    ? 'Loading…'
    : view?.connected
      ? `${view.googleEmail ?? 'Connected'} · ${view.status}`
      : view?.oauthConfigured === false
        ? 'OAuth not configured (GOOGLE_CLIENT_ID / SECRET).'
        : CARD_DESCRIPTION;

  return (
    <div className="min-w-0">
      <section className="border-border bg-card rounded-xl border p-4">
        <div className="flex items-start gap-3">
          <BookUser size={20} className="text-foreground mt-0.5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">Google Contacts</h3>
            <p className="text-muted-foreground mt-1 text-xs">{description}</p>
            {view?.lastSyncedAt ? (
              <p className="text-muted-foreground mt-1 text-xs">
                Last sync: {new Date(view.lastSyncedAt).toLocaleString()}
              </p>
            ) : null}
            {view?.lastErrorMessage ? (
              <p className="text-destructive mt-1 truncate text-xs">{view.lastErrorMessage}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {view?.connected ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading || syncing}
                    onClick={() => void syncNow()}
                  >
                    Sync now
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => void disconnect()}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={loading || connecting || view?.oauthConfigured === false}
                  onClick={() => void connect()}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
