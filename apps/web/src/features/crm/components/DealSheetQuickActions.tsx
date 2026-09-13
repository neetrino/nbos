'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { usePermission } from '@/lib/permissions';
import {
  DEAL_INVOICE_FIELDS_REQUIRED_MESSAGE,
  dealInvoiceCreateDeniedMessage,
} from '@/features/crm/utils/deal-invoice-create-guard';
import { useDealWhatsAppHeaderActions } from '../hooks/use-deal-whatsapp-header-actions';
import { DealSheetActionsMenu } from './DealSheetActionsMenu';
import { DealWhatsAppHeaderControl } from './DealWhatsAppHeaderControl';
import type { CrmTranslate } from '../i18n/crm-copy';

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
  const t = useTranslations('crm');
  const router = useRouter();
  const { can } = usePermission();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const whatsapp = useDealWhatsAppHeaderActions(deal, onRefresh);
  const taxStatus = deal.taxStatus ?? 'TAX';
  const canCreateInvoice = canOpenDealCreateInvoiceDialog(deal, taxStatus);
  const canAddInvoice = can('ADD', 'FINANCE_INVOICES');
  const requestCreateInvoice = useCallback(() => {
    const denied = dealInvoiceCreateDeniedMessage(canAddInvoice, canCreateInvoice);
    if (denied) {
      toast.error(
        denied === DEAL_INVOICE_FIELDS_REQUIRED_MESSAGE
          ? t('dealSheet.invoiceFieldsRequired')
          : denied,
      );
      return;
    }
    onCreateInvoice();
  }, [canAddInvoice, canCreateInvoice, onCreateInvoice, t]);
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
        canCreateInvoice: true,
        canStartEarlyDelivery,
        creatorId,
        creatorReady,
        depositBootstrap,
        onCreateInvoice: requestCreateInvoice,
        onCreateTask,
        onOpenDrive: () => router.push(buildDriveHrefWithDeal(deal.id)),
        onStartEarlyDelivery: () => void handleStartEarlyDelivery(),
        startingEarly,
        t,
      }),
    [
      canStartEarlyDelivery,
      creatorId,
      creatorReady,
      deal.id,
      depositBootstrap,
      handleStartEarlyDelivery,
      onCreateTask,
      requestCreateInvoice,
      router,
      startingEarly,
      t,
    ],
  );

  return (
    <>
      <DealWhatsAppHeaderControl
        dealId={deal.id}
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
  const t = useTranslations('crm');
  const [startingEarly, setStartingEarly] = useState(false);
  const handleStartEarlyDelivery = useCallback(async () => {
    if (!canStartEarlyDelivery) return;
    setStartingEarly(true);
    try {
      await dealsApi.startEarlyDelivery(dealId);
      onRefresh?.();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('dealSheet.startEarlyDeliveryError')));
    } finally {
      setStartingEarly(false);
    }
  }, [canStartEarlyDelivery, dealId, onRefresh, t]);
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
  t: CrmTranslate;
}): QuickActionItem[] {
  const items: QuickActionItem[] = [
    {
      id: 'create-invoice',
      label: input.depositBootstrap
        ? input.t('dealSheet.createDepositInvoice')
        : input.t('dealSheet.createInvoice'),
      icon: Plus,
      enabled: input.canCreateInvoice,
      disabledTitle: input.t('dealSheet.invoiceFieldsRequired'),
      onClick: input.onCreateInvoice,
    },
  ];
  if (input.canStartEarlyDelivery) {
    items.push({
      id: 'start-early-delivery',
      label: input.t('dealSheet.startEarlyDelivery'),
      icon: Rocket,
      enabled: !input.startingEarly,
      disabledTitle: input.startingEarly ? input.t('dealSheet.startingDelivery') : undefined,
      onClick: input.onStartEarlyDelivery,
    });
  }
  items.push({
    id: 'create-task',
    label: input.t('common.createTask'),
    icon: CheckSquare,
    enabled: !input.creatorReady || Boolean(input.creatorId),
    disabledTitle:
      input.creatorReady && !input.creatorId
        ? input.t('common.employeeProfileRequired')
        : undefined,
    onClick: input.onCreateTask,
  });
  items.push({
    id: 'open-drive',
    label: input.t('dealSheet.openDrive'),
    icon: FileText,
    enabled: true,
    onClick: input.onOpenDrive,
  });
  return items;
}
