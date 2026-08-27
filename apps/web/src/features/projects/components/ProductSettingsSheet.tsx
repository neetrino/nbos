'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import { WhatsAppBrandIcon } from '@/components/shared/WhatsAppBrandIcon';
import { PermissionGate } from '@/lib/permissions/PermissionGate';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  productWhatsAppApi,
  type ProductWhatsAppState,
  type WhatsAppAvailableGroup,
} from '@/lib/api/whatsapp';
import { isWhatsAppCreateInFlight } from '@/features/crm/whatsapp-create-status';
import {
  loadProductWhatsAppSettings,
  nextProductWhatsAppSettingsState,
} from '../product-whatsapp-settings';
import { ProductWhatsAppActionGrid } from './ProductWhatsAppActionGrid';
import { ProductWhatsAppBindControls } from './ProductWhatsAppBindControls';
import { ProductWhatsAppOperationHistory } from './ProductWhatsAppOperationHistory';
import { ProductWhatsAppStatusCard } from './ProductWhatsAppStatusCard';
import { WA_HEADER_ICON_WRAP } from './product-whatsapp-settings-ui';

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
  const [gatewayConfigured, setGatewayConfigured] = useState(false);
  const [gatewayNotice, setGatewayNotice] = useState<string | null>(null);
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
      const snapshot = await loadProductWhatsAppSettings(productId, search || undefined);
      setState((previous) => nextProductWhatsAppSettingsState(previous, snapshot.state));
      setGroups(snapshot.groups);
      setSelectedGroupId((previous) => snapshot.selectedGroupId || previous);
      setGatewayConfigured(snapshot.gatewayConfigured);
      setGatewayNotice(snapshot.gatewayNotice);
      if (snapshot.stateError && !snapshot.state) {
        toast.error(getApiErrorMessage(snapshot.stateError, 'Could not load WhatsApp settings.'));
      }
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
  const createInFlight =
    isWhatsAppCreateInFlight(status) || isWhatsAppCreateInFlight(state?.latestOperation?.status);

  return (
    <PermissionGate module="PROJECTS" action="EDIT">
      <PageSettingsSheet
        title="Product settings"
        description="WhatsApp group for this product only."
        titleLeading={
          <span className={WA_HEADER_ICON_WRAP} aria-hidden>
            <WhatsAppBrandIcon className="size-7" />
          </span>
        }
        triggerAriaLabel="Product settings"
        open={openProp}
        onOpenChange={handleOpenChange}
      >
        <section className="space-y-3">
          <ProductWhatsAppStatusCard
            loading={loading && !state}
            gatewayNotice={gatewayNotice}
            status={status}
            groupName={binding?.groupName}
            groupChatId={binding?.groupChatId}
            lastSuccessfulSyncAt={binding?.lastSuccessfulSyncAt}
            invitationStatus={state?.invitation?.status}
            lastErrorMessage={binding?.lastErrorMessage}
          />

          <ProductWhatsAppActionGrid
            busy={busy}
            gatewayConfigured={gatewayConfigured}
            status={status}
            createInFlight={createInFlight}
            createFailed={status === 'FAILED'}
            onCreateGroup={() =>
              void run(() => productWhatsAppApi.ensure(productId), 'Group creation started')
            }
            onSyncParticipants={() =>
              void run(() => productWhatsAppApi.sync(productId), 'Participant sync queued')
            }
            onSendClientInvitation={() =>
              void run(
                () => productWhatsAppApi.clientInvite(productId),
                'Client invitation queued',
              )
            }
            onResendInvitation={() => {
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
          />

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
            gatewayConfigured={gatewayConfigured}
            run={run}
          />

          <ProductWhatsAppOperationHistory
            productId={productId}
            open={sheetOpen}
            revision={state?.latestOperation?.id ?? state?.latestOperation?.status ?? ''}
          />
        </section>
      </PageSettingsSheet>
    </PermissionGate>
  );
}
