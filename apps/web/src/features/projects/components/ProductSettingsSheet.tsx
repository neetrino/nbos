'use client';

import { useCallback, useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PermissionGate } from '@/lib/permissions/PermissionGate';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  productWhatsAppApi,
  type ProductWhatsAppState,
  type WhatsAppAvailableGroup,
} from '@/lib/api/whatsapp';

interface ProductSettingsSheetProps {
  productId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductSettingsSheet({
  productId,
  open: openProp,
  onOpenChange,
}: ProductSettingsSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const [state, setState] = useState<ProductWhatsAppState | null>(null);
  const [groups, setGroups] = useState<WhatsAppAvailableGroup[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp === undefined) setUncontrolledOpen(next);
    },
    [onOpenChange, openProp],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextState, available] = await Promise.all([
        productWhatsAppApi.getState(productId),
        productWhatsAppApi.availableGroups(productId, search || undefined),
      ]);
      setState(nextState);
      setGroups(available.groups);
      setSelectedGroupId(available.currentGroupChatId ?? '');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load WhatsApp settings.'));
    } finally {
      setLoading(false);
    }
  }, [productId, search]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      await refresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'WhatsApp action failed.'));
    } finally {
      setBusy(false);
    }
  }

  const binding = state?.binding;
  const status = binding?.status ?? 'NOT_STARTED';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <PermissionGate module="PROJECTS" action="EDIT">
        <SheetTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              aria-label="Product settings"
            >
              <Settings size={14} aria-hidden />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          )}
        />
      </PermissionGate>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Product settings</SheetTitle>
          <SheetDescription>WhatsApp group for this Product only.</SheetDescription>
        </SheetHeader>

        <section className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold tracking-tight">WhatsApp Group</h3>
          {loading && !state ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                Status: <span className="font-medium">{status}</span>
              </p>
              <p>Group name: {binding?.groupName ?? '—'}</p>
              <p className="break-all">Group ID: {binding?.groupChatId ?? '—'}</p>
              <p>Last sync: {binding?.lastSuccessfulSyncAt ?? '—'}</p>
              <p>Invitation: {state?.invitation?.status ?? '—'}</p>
              {binding?.lastErrorMessage ? (
                <p className="text-destructive">{binding.lastErrorMessage}</p>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy || status === 'ACTIVE' || status === 'CREATING'}
              onClick={() =>
                void run(() => productWhatsAppApi.ensure(productId), 'Group creation started')
              }
            >
              {status === 'FAILED' ? 'Retry' : 'Create group'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || status !== 'ACTIVE'}
              onClick={() =>
                void run(() => productWhatsAppApi.sync(productId), 'Participant sync queued')
              }
            >
              Sync participants
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || status !== 'ACTIVE'}
              onClick={() =>
                void run(
                  () => productWhatsAppApi.clientInvite(productId),
                  'Client invitation queued',
                )
              }
            >
              Send client invitation
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || status !== 'ACTIVE'}
              onClick={() => {
                if (
                  !window.confirm(
                    'Resend client invitation? Only confirm if the previous send is safe to retry.',
                  )
                ) {
                  return;
                }
                void run(
                  () => productWhatsAppApi.clientInvite(productId, { forceResend: true }),
                  'Client invitation resend queued',
                );
              }}
            >
              Resend invitation
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="wa-group-search">
              Select existing group
            </label>
            <Input
              id="wa-group-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search groups"
            />
            <select
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
            >
              <option value="">Select a group…</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                  {group.missingFromGateway ? ' (missing from Gateway)' : ''}
                  {typeof group.participantCount === 'number' ? ` · ${group.participantCount}` : ''}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || !selectedGroupId}
              onClick={() => {
                const replace = Boolean(
                  binding?.groupChatId && binding.groupChatId !== selectedGroupId,
                );
                if (
                  replace &&
                  !window.confirm(
                    'Replace the current Product WhatsApp binding? The old WhatsApp group will not be deleted.',
                  )
                ) {
                  return;
                }
                void run(
                  () =>
                    productWhatsAppApi.bind(productId, {
                      groupChatId: selectedGroupId,
                      replace,
                    }),
                  replace ? 'Binding replaced' : 'Group bound',
                );
              }}
            >
              Bind selected group
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent operations</h4>
            <OperationHistory productId={productId} open={open} />
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
}

function OperationHistory({ productId, open }: { productId: string; open: boolean }) {
  const [items, setItems] = useState<
    Array<{ id: string; type: string; status: string; createdAt: string; errorCode: string | null }>
  >([]);

  useEffect(() => {
    if (!open) return;
    void productWhatsAppApi
      .operations(productId)
      .then((result) => setItems(result.items.slice(0, 10)))
      .catch(() => setItems([]));
  }, [open, productId]);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No operations yet.</p>;
  }

  return (
    <ul className="space-y-1 text-xs">
      {items.map((item) => (
        <li key={item.id} className="border-border rounded-md border px-2 py-1.5">
          <span className="font-medium">{item.type}</span> · {item.status}
          {item.errorCode ? ` · ${item.errorCode}` : ''}
          <div className="text-muted-foreground">{item.createdAt}</div>
        </li>
      ))}
    </ul>
  );
}
