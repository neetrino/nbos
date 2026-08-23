'use client';

import { useCallback, useEffect, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import { signOut } from 'next-auth/react';
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
  AUTH_SESSION_CLIENT_LABELS,
  formatSessionActivity,
} from '@/features/account/constants/auth-session-labels';

export function ActiveSessionsPanel() {
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
      setLoadError(getApiErrorMessage(caught, 'Could not load sessions.'));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function revoke(row: AuthSessionRow) {
    setBusy(true);
    setPendingId(row.id);
    try {
      await authApi.revokeSession(row.id);
      if (row.current) {
        toast.success('Signed out this device.');
        await signOut({ callbackUrl: '/sign-in' });
        return;
      }
      toast.success('Device signed out.');
      await refresh();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not sign out that device.'));
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
      toast.success(
        result.revoked === 0 ? 'No other devices were signed in.' : 'Other devices signed out.',
      );
      setConfirmOthers(false);
      await refresh();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not sign out other devices.'));
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
          <h3 className="text-sm font-semibold tracking-tight">Active sessions</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Devices signed in with your NBOS account. Available after the new sign-in is enabled.
          </p>
        </div>
      </div>

      {sessions === null ? (
        <p className="text-muted-foreground text-xs">Loading sessions…</p>
      ) : null}
      {loadError ? <p className="text-destructive text-xs">{loadError}</p> : null}
      {sessions && rows.length === 0 && !loadError ? (
        <p className="text-muted-foreground text-xs">
          Session list is available after the new sign-in is enabled.
        </p>
      ) : null}

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {AUTH_SESSION_CLIENT_LABELS[row.clientKind]}
                {row.deviceLabel ? ` · ${row.deviceLabel}` : ''}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatSessionActivity(row.lastUsedAt, row.current)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy && pendingId === row.id}
              onClick={() => (row.current ? setConfirmCurrent(row) : void revoke(row))}
            >
              Sign out
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
          Sign out other devices
        </Button>
      ) : null}

      <Dialog open={confirmOthers} onOpenChange={setConfirmOthers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out other devices?</DialogTitle>
            <DialogDescription>
              This device stays signed in. Every other web or mobile session will end.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmOthers(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void revokeOthers()}>
              Sign out others
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
            <DialogTitle>Sign out this device?</DialogTitle>
            <DialogDescription>You will need to sign in again to use NBOS here.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmCurrent(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => confirmCurrent && void revoke(confirmCurrent)}
            >
              Sign out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
