'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import { PermissionGate } from '@/lib/permissions/PermissionGate';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  productWhatsAppApi,
  type ProductWhatsAppState,
  type WhatsAppAvailableGroup,
} from '@/lib/api/whatsapp';
import { WhatsAppGroupMissingBadge } from '@/features/crm/components/WhatsAppGroupMissingBadge';
import { isMissingActiveWhatsAppGroup } from '@/features/crm/deal-won-whatsapp-gate';
import {
  isWhatsAppCreateInFlight,
  whatsappCreateButtonLabel,
} from '@/features/crm/whatsapp-create-status';
import { ProductWhatsAppBindControls } from './ProductWhatsAppBindControls';
import { ProductWhatsAppOperationHistory } from './ProductWhatsAppOperationHistory';

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
                  <dd className="text-foreground flex flex-wrap items-center justify-end gap-1.5 font-medium">
                    {isMissingActiveWhatsAppGroup({
                      bindingStatus: status === 'NOT_STARTED' ? null : status,
                      groupChatId: binding?.groupChatId,
                    }) ? (
                      <WhatsAppGroupMissingBadge
                        bindingStatus={status === 'NOT_STARTED' ? null : status}
                        groupChatId={binding?.groupChatId}
                      />
                    ) : (
                      status
                    )}
                  </dd>
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
              disabled={
                busy ||
                status === 'ACTIVE' ||
                isWhatsAppCreateInFlight(status) ||
                isWhatsAppCreateInFlight(state?.latestOperation?.status)
              }
              onClick={() =>
                void run(() => productWhatsAppApi.ensure(productId), 'Group creation started')
              }
            >
              {whatsappCreateButtonLabel({
                inFlight:
                  isWhatsAppCreateInFlight(status) ||
                  isWhatsAppCreateInFlight(state?.latestOperation?.status),
                failed: status === 'FAILED',
                idleLabel: 'Create group',
              })}
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

          <ProductWhatsAppBindControls
            productId={productId}
            search={search}
            onSearchChange={setSearch}
            groups={groups}
            loading={loading}
            selectedGroupId={selectedGroupId}
            onSelectedGroupIdChange={setSelectedGroupId}
            currentGroupChatId={binding?.groupChatId}
            busy={busy}
            run={run}
          />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent operations</h4>
            <ProductWhatsAppOperationHistory
              productId={productId}
              open={sheetOpen}
              revision={state?.latestOperation?.id ?? state?.latestOperation?.status ?? ''}
            />
          </div>
        </section>
      </PageSettingsSheet>
    </PermissionGate>
  );
}
