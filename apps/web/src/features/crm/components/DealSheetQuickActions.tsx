'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, FileText, Plus, Rocket, type LucideIcon } from 'lucide-react';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { buildDriveHrefWithDeal } from '@/features/drive/drive-deep-link';
import {
  canCreateDepositInvoice,
  canOpenDealCreateInvoiceDialog,
} from '@/features/crm/utils/deal-invoice-eligibility';
import type { Deal } from '@/lib/api/deals';
import { dealsApi } from '@/lib/api/deals';
import { dealWhatsAppApi, productWhatsAppApi, type ProductWhatsAppState } from '@/lib/api/whatsapp';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { DealSheetActionsMenu } from './DealSheetActionsMenu';
import { WhatsAppGroupMissingBadge } from './WhatsAppGroupMissingBadge';
import { isMissingActiveWhatsAppGroup } from '../deal-won-whatsapp-gate';
import { buildDealWhatsAppQuickAction } from '../deal-whatsapp-quick-action';
import { isWhatsAppCreateInFlight } from '../whatsapp-create-status';

interface DealSheetQuickActionsProps {
  deal: Deal;
  onRefresh?: () => void;
  onCreateInvoice: () => void;
  onCreateTask: () => void;
}

interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  disabledTitle?: string;
  onClick?: () => void;
}

function resolveDealProductId(deal: Deal): string | null {
  if (deal.existingProductId) return deal.existingProductId;
  const orderWithProduct = deal.orders?.find((order) => Boolean(order.productId));
  return orderWithProduct?.productId ?? null;
}

export function DealSheetQuickActions({
  deal,
  onRefresh,
  onCreateInvoice,
  onCreateTask,
}: DealSheetQuickActionsProps) {
  const router = useRouter();
  const [startingEarly, setStartingEarly] = useState(false);
  const [whatsappBusy, setWhatsappBusy] = useState(false);
  const [whatsappState, setWhatsappState] = useState<ProductWhatsAppState | null>(null);
  const { creatorId, creatorReady } = useTaskCreatorId();

  const firstOrder = deal.orders?.[0];
  const projectId = deal.projectId ?? firstOrder?.projectId;
  const productId = resolveDealProductId(deal);
  const taxStatus = deal.taxStatus ?? 'TAX';
  const canCreateInvoice = canOpenDealCreateInvoiceDialog(deal, taxStatus);
  const depositBootstrap = canCreateDepositInvoice(deal, taxStatus);

  useEffect(() => {
    if (!productId) {
      setWhatsappState(null);
      return;
    }
    let cancelled = false;
    void productWhatsAppApi
      .getState(productId)
      .then((state) => {
        if (!cancelled) setWhatsappState(state);
      })
      .catch(() => {
        if (!cancelled) setWhatsappState(null);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const canStartEarlyDelivery = Boolean(
    firstOrder &&
    firstOrder.invoices.length > 0 &&
    firstOrder.deliveryStartMode !== 'EARLY_START' &&
    firstOrder.deliveryStartMode !== 'EXCEPTION_IMMEDIATE' &&
    firstOrder.invoices.some((invoice) => invoice.moneyStatus !== 'PAID') &&
    deal.status !== 'WON' &&
    deal.status !== 'FAILED',
  );

  const handleStartEarlyDelivery = useCallback(async () => {
    if (!canStartEarlyDelivery) return;
    setStartingEarly(true);
    try {
      await dealsApi.startEarlyDelivery(deal.id);
      onRefresh?.();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not start early delivery.'));
    } finally {
      setStartingEarly(false);
    }
  }, [canStartEarlyDelivery, deal.id, onRefresh]);

  const handleEnsureWhatsApp = useCallback(async () => {
    if (!productId || whatsappBusy) return;
    setWhatsappBusy(true);
    try {
      const state = await dealWhatsAppApi.ensure(deal.id);
      setWhatsappState(state);
      toast.success('WhatsApp group creation started.');
      onRefresh?.();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not start WhatsApp group creation.'));
    } finally {
      setWhatsappBusy(false);
    }
  }, [deal.id, onRefresh, productId, whatsappBusy]);

  const bindingStatus = whatsappState?.binding?.status ?? null;

  const actions = useMemo(() => {
    const items: QuickActionItem[] = [
      {
        id: 'create-invoice',
        label: depositBootstrap ? 'Create deposit invoice' : 'Create invoice',
        icon: Plus,
        enabled: canCreateInvoice,
        disabledTitle:
          'Fill required: Cost, Payment Type, Contact, Deal Type, Tax Status; if Tax then Company',
        onClick: onCreateInvoice,
      },
    ];

    if (canStartEarlyDelivery) {
      items.push({
        id: 'start-early-delivery',
        label: 'Start delivery before payment',
        icon: Rocket,
        enabled: !startingEarly,
        disabledTitle: startingEarly ? 'Starting delivery…' : undefined,
        onClick: () => void handleStartEarlyDelivery(),
      });
    }

    items.push(
      buildDealWhatsAppQuickAction({
        productId,
        projectId,
        bindingStatus,
        latestOperationStatus: whatsappState?.latestOperation?.status,
        whatsappBusy,
        onEnsure: () => void handleEnsureWhatsApp(),
        onOpenSettings: (id) => {
          router.push(
            projectId ? `/projects/${projectId}/products/${id}?settings=whatsapp` : '/projects',
          );
        },
      }),
    );

    items.push({
      id: 'create-task',
      label: 'Create task',
      icon: CheckSquare,
      enabled: !creatorReady || Boolean(creatorId),
      disabledTitle: creatorReady && !creatorId ? 'Employee profile required' : undefined,
      onClick: onCreateTask,
    });

    items.push({
      id: 'open-drive',
      label: 'Open drive',
      icon: FileText,
      enabled: true,
      onClick: () => router.push(buildDriveHrefWithDeal(deal.id)),
    });

    return items;
  }, [
    bindingStatus,
    canCreateInvoice,
    canStartEarlyDelivery,
    creatorId,
    creatorReady,
    deal.id,
    depositBootstrap,
    handleEnsureWhatsApp,
    handleStartEarlyDelivery,
    onCreateInvoice,
    onCreateTask,
    productId,
    projectId,
    router,
    startingEarly,
    whatsappBusy,
    whatsappState,
  ]);

  const showWhatsAppMissing =
    Boolean(productId) &&
    isMissingActiveWhatsAppGroup({
      bindingStatus,
      groupChatId: whatsappState?.binding?.groupChatId,
    });

  return (
    <>
      {showWhatsAppMissing ? (
        <WhatsAppGroupMissingBadge
          bindingStatus={bindingStatus}
          groupChatId={whatsappState?.binding?.groupChatId}
        />
      ) : null}
      <DealSheetActionsMenu actions={actions} />
    </>
  );
}
