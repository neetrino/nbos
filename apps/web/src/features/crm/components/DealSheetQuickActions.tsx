'use client';

import { useCallback, useMemo, useState } from 'react';
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
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { useDealWhatsAppHeaderActions } from '../hooks/use-deal-whatsapp-header-actions';
import { DealSheetActionsMenu } from './DealSheetActionsMenu';
import { DealWhatsAppHeaderControl } from './DealWhatsAppHeaderControl';

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

export function DealSheetQuickActions({
  deal,
  onRefresh,
  onCreateInvoice,
  onCreateTask,
}: DealSheetQuickActionsProps) {
  const router = useRouter();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const whatsapp = useDealWhatsAppHeaderActions(deal, onRefresh);
  const taxStatus = deal.taxStatus ?? 'TAX';
  const canCreateInvoice = canOpenDealCreateInvoiceDialog(deal, taxStatus);
  const depositBootstrap = canCreateDepositInvoice(deal, taxStatus);
  const canStartEarlyDelivery = canStartDealEarlyDelivery(deal, deal.orders?.[0]);
  const { startingEarly, handleStartEarlyDelivery } = useStartEarlyDelivery(
    deal.id,
    canStartEarlyDelivery,
    onRefresh,
  );

  const actions = useMemo(
    () =>
      buildDealSheetMenuActions({
        canCreateInvoice,
        canStartEarlyDelivery,
        creatorId,
        creatorReady,
        depositBootstrap,
        onCreateInvoice,
        onCreateTask,
        onOpenDrive: () => router.push(buildDriveHrefWithDeal(deal.id)),
        onStartEarlyDelivery: () => void handleStartEarlyDelivery(),
        startingEarly,
      }),
    [
      canCreateInvoice,
      canStartEarlyDelivery,
      creatorId,
      creatorReady,
      deal.id,
      depositBootstrap,
      handleStartEarlyDelivery,
      onCreateInvoice,
      onCreateTask,
      router,
      startingEarly,
    ],
  );

  return (
    <>
      <DealWhatsAppHeaderControl
        actions={whatsapp.whatsappActions}
        bindOpen={whatsapp.bindOpen}
        busy={whatsapp.whatsappBusy}
        onBindOpenChange={whatsapp.setBindOpen}
        onBindSubmit={whatsapp.handleBindWhatsApp}
      />
      <DealSheetActionsMenu actions={actions} />
    </>
  );
}

function useStartEarlyDelivery(
  dealId: string,
  canStartEarlyDelivery: boolean,
  onRefresh?: () => void,
) {
  const [startingEarly, setStartingEarly] = useState(false);
  const handleStartEarlyDelivery = useCallback(async () => {
    if (!canStartEarlyDelivery) return;
    setStartingEarly(true);
    try {
      await dealsApi.startEarlyDelivery(dealId);
      onRefresh?.();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not start early delivery.'));
    } finally {
      setStartingEarly(false);
    }
  }, [canStartEarlyDelivery, dealId, onRefresh]);
  return { handleStartEarlyDelivery, startingEarly };
}

function canStartDealEarlyDelivery(deal: Deal, firstOrder: Deal['orders'][number] | undefined) {
  return Boolean(
    firstOrder &&
    firstOrder.invoices.length > 0 &&
    firstOrder.deliveryStartMode !== 'EARLY_START' &&
    firstOrder.deliveryStartMode !== 'EXCEPTION_IMMEDIATE' &&
    firstOrder.invoices.some((invoice) => invoice.moneyStatus !== 'PAID') &&
    deal.status !== 'WON' &&
    deal.status !== 'FAILED',
  );
}

function buildDealSheetMenuActions(input: {
  canCreateInvoice: boolean;
  canStartEarlyDelivery: boolean;
  creatorId: string | null;
  creatorReady: boolean;
  depositBootstrap: boolean;
  onCreateInvoice: () => void;
  onCreateTask: () => void;
  onOpenDrive: () => void;
  onStartEarlyDelivery: () => void;
  startingEarly: boolean;
}): QuickActionItem[] {
  const items: QuickActionItem[] = [
    {
      id: 'create-invoice',
      label: input.depositBootstrap ? 'Create deposit invoice' : 'Create invoice',
      icon: Plus,
      enabled: input.canCreateInvoice,
      disabledTitle:
        'Fill required: Cost, Payment Type, Contact, Deal Type, Tax Status; if Tax then Company',
      onClick: input.onCreateInvoice,
    },
  ];
  if (input.canStartEarlyDelivery) {
    items.push({
      id: 'start-early-delivery',
      label: 'Start delivery before payment',
      icon: Rocket,
      enabled: !input.startingEarly,
      disabledTitle: input.startingEarly ? 'Starting delivery…' : undefined,
      onClick: input.onStartEarlyDelivery,
    });
  }
  items.push({
    id: 'create-task',
    label: 'Create task',
    icon: CheckSquare,
    enabled: !input.creatorReady || Boolean(input.creatorId),
    disabledTitle: input.creatorReady && !input.creatorId ? 'Employee profile required' : undefined,
    onClick: input.onCreateTask,
  });
  items.push({
    id: 'open-drive',
    label: 'Open drive',
    icon: FileText,
    enabled: true,
    onClick: input.onOpenDrive,
  });
  return items;
}
