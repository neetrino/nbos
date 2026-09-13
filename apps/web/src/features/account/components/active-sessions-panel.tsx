'use client';

import { useCallback, useEffect, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import { signOutClient } from '@/lib/auth/session-sign-out';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { authApi, type AuthSessionRow } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  AUTH_SESSION_CLIENT_MESSAGE_KEYS,
  resolveSessionActivity,
  type SessionActivity,
} from '@/features/account/constants/auth-session-labels';
import { useTranslations } from 'next-intl';

function sessionActivityLabel(
  activity: SessionActivity,
  t: ReturnType<typeof useTranslations<'account.sessions'>>,
): string {
  if (activity.kind === 'thisDevice') return t('thisDevice');
  if (activity.kind === 'unknown') return t('unknown');
  if (activity.kind === 'activeNow') return t('activeNow');
  if (activity.kind === 'minutesAgo') return t('minutesAgo', { count: activity.count });
  if (activity.kind === 'hoursAgo') return t('hoursAgo', { count: activity.count });
  return t('daysAgo', { count: activity.count });
}

export function ActiveSessionsPanel() {
  const t = useTranslations('account.sessions');
  const tCommon = useTranslations('common');
  const [sessions, setSessions] = useState<AuthSessionRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [confirmCurrent, setConfirmCurrent] = useState<AuthSessionRow | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      setSessions(await authApi.listSessions());
    } catch (caught) {
      setSessions([]);
      setLoadError(getApiErrorMessage(caught, t('loadFailed')));
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function revoke(row: AuthSessionRow) {
    setBusy(true);
    setPendingId(row.id);
    try {
      await authApi.revokeSession(row.id);
      if (row.current) {
        toast.success(t('signedOutThis'));
        await signOutClient();
        return;
      }
      toast.success(t('signedOutDevice'));
      await refresh();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('revokeFailed')));
    } finally {
      setBusy(false);
      setPendingId(null);
      setConfirmCurrent(null);
    }
  }

  async function revokeOthers() {
    setBusy(true);
    try {
      const result = await authApi.logoutOthers();
      toast.success(result.revoked === 0 ? t('othersNone') : t('othersDone'));
      setConfirmOthers(false);
      await refresh();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('othersFailed')));
    } finally {
      setBusy(false);
    }
  }

  const rows = sessions ?? [];
  const hasOthers = rows.some((row) => !row.current);

  return (
    <div className="space-y-4 border-t p-5">
      <div className="flex items-start gap-3">
        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <MonitorSmartphone className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight">{t('title')}</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{t('description')}</p>
        </div>
      </div>

      {sessions === null ? <p className="text-muted-foreground text-xs">{t('loading')}</p> : null}
      {loadError ? <p className="text-destructive text-xs">{loadError}</p> : null}
      {sessions && rows.length === 0 && !loadError ? (
        <p className="text-muted-foreground text-xs">{t('empty')}</p>
      ) : null}

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {t(AUTH_SESSION_CLIENT_MESSAGE_KEYS[row.clientKind])}
                {row.deviceLabel ? ` · ${row.deviceLabel}` : ''}
              </p>
              <p className="text-muted-foreground text-xs">
                {sessionActivityLabel(resolveSessionActivity(row.lastUsedAt, row.current), t)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy && pendingId === row.id}
              onClick={() => (row.current ? setConfirmCurrent(row) : void revoke(row))}
            >
              {t('signOut')}
            </Button>
          </li>
        ))}
      </ul>

      {hasOthers ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => setConfirmOthers(true)}
        >
          {t('signOutOthers')}
        </Button>
      ) : null}

      <Dialog open={confirmOthers} onOpenChange={setConfirmOthers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmOthersTitle')}</DialogTitle>
            <DialogDescription>{t('confirmOthersDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmOthers(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void revokeOthers()}>
              {t('confirmOthersAction')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmCurrent)}
        onOpenChange={(open) => !open && setConfirmCurrent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmCurrentTitle')}</DialogTitle>
            <DialogDescription>{t('confirmCurrentDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmCurrent(null)}>
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => confirmCurrent && void revoke(confirmCurrent)}
            >
              {t('signOut')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
