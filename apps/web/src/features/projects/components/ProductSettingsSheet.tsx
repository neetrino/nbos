'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
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
  const [localOpen, setLocalOpen] = useState(false);
  const [state, setState] = useState<ProductWhatsAppState | null>(null);
  const [groups, setGroups] = useState<WhatsAppAvailableGroup[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const sheetOpen = openProp ?? localOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp === undefined) setLocalOpen(next);
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
    if (!sheetOpen) return;
    void refresh();
  }, [sheetOpen, refresh]);

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
    <PermissionGate module="PROJECTS" action="EDIT">
      <PageSettingsSheet
        title="Product settings"
        description="WhatsApp group for this product only."
        triggerAriaLabel="Product settings"
        open={openProp}
        onOpenChange={handleOpenChange}
      >
        <section className="space-y-4">
          <div>
            <h3 className="text-foreground mb-2 text-sm font-semibold tracking-tight">
              WhatsApp group
            </h3>
            {loading && !state ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <dl className="text-muted-foreground space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Status</dt>
                  <dd className="text-foreground font-medium">{status}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Group name</dt>
                  <dd className="text-foreground min-w-0 truncate text-right font-medium">
                    {binding?.groupName ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Group ID</dt>
                  <dd className="text-foreground min-w-0 truncate text-right font-medium">
                    {binding?.groupChatId ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Last sync</dt>
                  <dd className="text-foreground text-right font-medium">
                    {binding?.lastSuccessfulSyncAt ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Invitation</dt>
                  <dd className="text-foreground font-medium">
                    {state?.invitation?.status ?? '—'}
                  </dd>
                </div>
                {binding?.lastErrorMessage ? (
                  <p className="text-destructive pt-1">{binding.lastErrorMessage}</p>
                ) : null}
              </dl>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              disabled={busy || status === 'ACTIVE' || status === 'CREATING'}
              onClick={() =>
                void run(() => productWhatsAppApi.ensure(productId), 'Group creation started')
              }
            >
              {status === 'FAILED' ? 'Retry create group' : 'Create group'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              disabled={busy || status !== 'ACTIVE'}
              onClick={() =>
                void run(() => productWhatsAppApi.sync(productId), 'Participant sync queued')
              }
            >
              Sync participants
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
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
              variant="outline"
              className="justify-start"
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
            {groups.length > 0 ? (
              <Select
                value={selectedGroupId || undefined}
                onValueChange={(value) => {
                  if (value) setSelectedGroupId(value);
                }}
              >
                <SelectTrigger className="w-full" aria-label="Select WhatsApp group">
                  <SelectValue placeholder="Select a group…">
                    {(value: string | null) => {
                      if (!value) return null;
                      const group = groups.find((item) => item.id === value);
                      if (!group) return value;
                      return formatWhatsAppGroupOptionLabel(group);
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {formatWhatsAppGroupOptionLabel(group)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : !loading ? (
              <p className="text-muted-foreground text-xs">No groups match this search.</p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
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
            <OperationHistory productId={productId} open={sheetOpen} />
          </div>
        </section>
      </PageSettingsSheet>
    </PermissionGate>
  );
}

function formatWhatsAppGroupOptionLabel(group: WhatsAppAvailableGroup): string {
  const missing = group.missingFromGateway ? ' (missing from Gateway)' : '';
  const count = typeof group.participantCount === 'number' ? ` · ${group.participantCount}` : '';
  return `${group.name}${missing}${count}`;
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
    <ul className="space-y-1.5 text-xs">
      {items.map((item) => (
        <li key={item.id} className="border-border bg-muted/30 rounded-lg border px-2.5 py-2">
          <span className="text-foreground font-medium">{item.type}</span>
          <span className="text-muted-foreground"> · {item.status}</span>
          {item.errorCode ? <span className="text-destructive"> · {item.errorCode}</span> : null}
          <div className="text-muted-foreground mt-0.5">{item.createdAt}</div>
        </li>
      ))}
    </ul>
  );
}
