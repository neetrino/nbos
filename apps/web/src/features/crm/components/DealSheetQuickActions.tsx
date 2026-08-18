'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckSquare,
  ChevronDown,
  FileText,
  MessageCircle,
  Plus,
  Rocket,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QuickCreateTaskDialog } from '@/components/shared';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { buildDriveHrefWithDeal } from '@/features/drive/drive-deep-link';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { dealOrderToCreateInvoiceOrder } from '@/features/finance/components/invoices/deal-order-to-create-invoice-order';
import {
  canCreateDepositInvoice,
  canOpenDealCreateInvoiceDialog,
} from '@/features/crm/utils/deal-invoice-eligibility';
import { submitDealInvoiceCreation } from '@/features/crm/utils/submit-deal-invoice-creation';
import type { Deal } from '@/lib/api/deals';
import { dealsApi } from '@/lib/api/deals';
import { dealWhatsAppApi, productWhatsAppApi, type ProductWhatsAppState } from '@/lib/api/whatsapp';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { WhatsAppGroupMissingBadge } from './WhatsAppGroupMissingBadge';
import { isMissingActiveWhatsAppGroup } from '../deal-won-whatsapp-gate';

interface DealSheetQuickActionsProps {
  deal: Deal;
  onRefresh?: () => void;
  onOpenTaskTab?: () => void;
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
  onOpenTaskTab,
}: DealSheetQuickActionsProps) {
  const router = useRouter();
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [startingEarly, setStartingEarly] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [whatsappBusy, setWhatsappBusy] = useState(false);
  const [whatsappState, setWhatsappState] = useState<ProductWhatsAppState | null>(null);
  const { creatorId, creatorReady } = useTaskCreatorId();

  const firstOrder = deal.orders?.[0];
  const projectId = deal.projectId ?? firstOrder?.projectId;
  const productId = resolveDealProductId(deal);
  const taxStatus = deal.taxStatus ?? 'TAX';
  const createInvoiceOrder = firstOrder ? dealOrderToCreateInvoiceOrder(deal, firstOrder) : null;
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

  const defaultLinks = useMemo(
    () => (projectId ? getTaskLinks(deal.id, projectId) : undefined),
    [deal.id, projectId],
  );

  const submitOverride = useCallback(
    async (form: { amount: string; dueDate: string }) => {
      await submitDealInvoiceCreation(deal.id, form, createInvoiceOrder);
    },
    [deal.id, createInvoiceOrder],
  );

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
        onClick: () => setCreateInvoiceOpen(true),
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

    if (!productId) {
      items.push({
        id: 'whatsapp-group',
        label: 'Create WhatsApp group',
        icon: MessageCircle,
        enabled: false,
        disabledTitle: 'Product has not been created yet.',
      });
    } else if (bindingStatus === 'ACTIVE') {
      items.push({
        id: 'whatsapp-settings',
        label: 'Open WhatsApp settings',
        icon: MessageCircle,
        enabled: true,
        onClick: () => {
          const projectHref = projectId
            ? `/projects/${projectId}/products/${productId}?settings=whatsapp`
            : `/projects`;
          router.push(projectHref);
        },
      });
    } else if (bindingStatus === 'PENDING' || bindingStatus === 'CREATING') {
      items.push({
        id: 'whatsapp-group',
        label: 'Creating WhatsApp group...',
        icon: MessageCircle,
        enabled: false,
        disabledTitle: 'WhatsApp group creation is in progress',
      });
    } else if (bindingStatus === 'OUTCOME_UNKNOWN' || bindingStatus === 'NEEDS_RECONCILIATION') {
      items.push({
        id: 'whatsapp-resolve',
        label: 'Resolve WhatsApp group',
        icon: MessageCircle,
        enabled: true,
        onClick: () => {
          if (!projectId) return;
          router.push(`/projects/${projectId}/products/${productId}?settings=whatsapp`);
        },
      });
    } else if (bindingStatus === 'FAILED') {
      items.push({
        id: 'whatsapp-retry',
        label: 'Retry WhatsApp group creation',
        icon: MessageCircle,
        enabled: !whatsappBusy,
        onClick: () => void handleEnsureWhatsApp(),
      });
    } else {
      items.push({
        id: 'whatsapp-group',
        label: 'Create WhatsApp group',
        icon: MessageCircle,
        enabled: !whatsappBusy,
        onClick: () => void handleEnsureWhatsApp(),
      });
    }

    if (projectId) {
      items.push({
        id: 'create-task',
        label: 'Create task',
        icon: CheckSquare,
        enabled: !creatorReady || Boolean(creatorId),
        disabledTitle: creatorReady && !creatorId ? 'Employee profile required' : undefined,
        onClick: () => setQuickCreateOpen(true),
      });
    }

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
    productId,
    projectId,
    router,
    startingEarly,
    whatsappBusy,
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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button {...props} type="button" variant="outline" size="sm" className="gap-1.5">
              <Zap size={14} aria-hidden />
              Actions
              <ChevronDown size={14} className="opacity-60" aria-hidden />
            </Button>
          )}
        />
        <DropdownMenuContent align="end" className="min-w-44">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={action.id}
                disabled={!action.enabled}
                title={action.disabledTitle}
                onClick={() => action.onClick?.()}
              >
                <Icon />
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {canCreateInvoice ? (
        <CreateInvoiceDialog
          open={createInvoiceOpen}
          onOpenChange={setCreateInvoiceOpen}
          order={createInvoiceOrder}
          submitOverride={submitOverride}
          forceNestedBackdrop
          onCreated={() => {
            onRefresh?.();
          }}
        />
      ) : null}

      <QuickCreateTaskDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        creatorId={creatorId ?? ''}
        creatorReady={creatorReady}
        defaultLinks={defaultLinks}
        forceNestedBackdrop
        onCreated={() => {
          onOpenTaskTab?.();
          onRefresh?.();
        }}
      />
    </>
  );
}

function getTaskLinks(dealId: string, projectId: string) {
  return [
    { entityType: 'DEAL', entityId: dealId },
    { entityType: 'PROJECT', entityId: projectId },
  ];
}
