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
import { isWhatsAppCreateInFlightFromLatest } from '@/features/crm/whatsapp-create-status';
import { cn } from '@/lib/utils';
import {
  canRefreshProductWhatsAppFromStoredId,
  CLIENT_INVITE_CONFIRM,
  CLIENT_INVITE_RESEND_CONFIRM,
  clientInviteNeedsForceResend,
  loadProductWhatsAppSettings,
  nextProductWhatsAppSettingsState,
  productWhatsAppBindingView,
} from '../product-whatsapp-settings';
import { ProductFinanceCommunicationSection } from './ProductFinanceCommunicationSection';
import { ProductWhatsAppActionGrid } from './ProductWhatsAppActionGrid';
import { ProductWhatsAppBindControls } from './ProductWhatsAppBindControls';
import { ProductWhatsAppNavTrigger } from './ProductWhatsAppNavTrigger';
import { ProductWhatsAppOperationHistory } from './ProductWhatsAppOperationHistory';
import { ProductWhatsAppStatusCard } from './ProductWhatsAppStatusCard';
import { WA_HEADER_ICON_WRAP } from './product-whatsapp-settings-ui';

interface ProductSettingsSheetProps {
  productId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Open control style. Default is the page settings gear. */
  triggerVariant?: 'default' | 'tab' | 'inline' | 'tile';
  className?: string;
}

export function ProductSettingsSheet({
  productId,
  open: openProp,
  onOpenChange,
  triggerVariant = 'default',
  className,
}: ProductSettingsSheetProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [state, setState] = useState<ProductWhatsAppState | null>(null);
  const [groups, setGroups] = useState<WhatsAppAvailableGroup[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedFinanceGroupId, setSelectedFinanceGroupId] = useState('');
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

  const bindingView = productWhatsAppBindingView(state);
  const status = bindingView.status;
  const createInFlight = isWhatsAppCreateInFlightFromLatest({
    bindingStatus: status,
    latestOperationType: state?.latestOperation?.type,
    latestOperationStatus: state?.latestOperation?.status,
  });
  const canSyncFromGroupId = canRefreshProductWhatsAppFromStoredId({
    groupChatId: bindingView.groupChatId,
    busy,
    gatewayConfigured,
  });

  function syncFromStoredGroupId() {
    const groupChatId = bindingView.groupChatId;
    if (!groupChatId) return;
    void run(() => productWhatsAppApi.bind(productId, { groupChatId }), 'Group details synced');
  }

  function inviteClient() {
    const forceResend = clientInviteNeedsForceResend(state?.invitation?.status);
    const confirmed = window.confirm(
      forceResend ? CLIENT_INVITE_RESEND_CONFIRM : CLIENT_INVITE_CONFIRM,
    );
    if (!confirmed) return;
    void run(
      () => productWhatsAppApi.clientInvite(productId, forceResend ? { forceResend: true } : {}),
      forceResend ? 'Client invitation resend queued' : 'Client invitation queued',
    );
  }

  return (
    <PermissionGate module="PROJECTS" action="EDIT">
      <PageSettingsSheet
        title="Product settings"
        description="Client communication destinations for this product."
        titleLeading={
          <span className={WA_HEADER_ICON_WRAP} aria-hidden>
            <WhatsAppBrandIcon className="size-7" />
          </span>
        }
        triggerAriaLabel="WhatsApp"
        renderTrigger={
          triggerVariant === 'default'
            ? undefined
            : (props) => (
                <ProductWhatsAppNavTrigger
                  {...props}
                  variant={triggerVariant}
                  className={cn(props.className, className)}
                />
              )
        }
        open={openProp}
        onOpenChange={handleOpenChange}
      >
        <section className="space-y-3">
          <h3 className="text-foreground mb-3 text-sm font-semibold tracking-tight">WORK</h3>
          <ProductWhatsAppStatusCard
            loading={loading && !state}
            gatewayNotice={gatewayNotice}
            status={status}
            groupName={bindingView.groupName}
            groupChatId={bindingView.groupChatId}
            lastSuccessfulSyncAt={
              status === 'ACTIVE' ? (state?.binding?.lastSuccessfulSyncAt ?? null) : null
            }
            invitationStatus={state?.invitation?.status}
            lastErrorMessage={
              status === 'FAILED' ? (state?.binding?.lastErrorMessage ?? null) : null
            }
            syncBusy={busy}
            canSyncFromGroupId={canSyncFromGroupId}
            onSyncFromGroupId={syncFromStoredGroupId}
          />

          <ProductWhatsAppActionGrid
            busy={busy}
            gatewayConfigured={gatewayConfigured}
            status={status}
            createInFlight={createInFlight}
            createFailed={status === 'FAILED'}
            onCreateGroup={() =>
              void run(() => productWhatsAppApi.ensure(productId, 'WORK'), 'Group creation started')
            }
            onSyncParticipants={() =>
              void run(() => productWhatsAppApi.sync(productId), 'Participant sync queued')
            }
            onInviteClient={inviteClient}
          />

          <ProductWhatsAppBindControls
            productId={productId}
            search={search}
            onSearchChange={setSearch}
            groups={groups}
            loading={loading}
            selectedGroupId={selectedGroupId}
            onSelectedGroupIdChange={setSelectedGroupId}
            currentGroupChatId={bindingView.groupChatId}
            busy={busy}
            gatewayConfigured={gatewayConfigured}
            purpose="WORK"
            run={run}
          />

          <ProductFinanceCommunicationSection
            productId={productId}
            financeUsesWork={state?.financeUsesWork !== false}
            financeGroupChatId={
              state?.finance && !state.finance.fallbackFromWork ? state.finance.groupChatId : null
            }
            busy={busy}
            gatewayConfigured={gatewayConfigured}
            onCreateFinance={() =>
              void run(
                () => productWhatsAppApi.ensure(productId, 'FINANCE'),
                'FINANCE group creation started',
              )
            }
            run={run}
          />

          <ProductWhatsAppBindControls
            productId={productId}
            search={search}
            onSearchChange={setSearch}
            groups={groups}
            loading={loading}
            selectedGroupId={selectedFinanceGroupId}
            onSelectedGroupIdChange={setSelectedFinanceGroupId}
            currentGroupChatId={
              state?.finance && !state.finance.fallbackFromWork ? state.finance.groupChatId : null
            }
            busy={busy}
            gatewayConfigured={gatewayConfigured}
            purpose="FINANCE"
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
