'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckSquare,
  ChevronDown,
  FileText,
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
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

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

export function DealSheetQuickActions({
  deal,
  onRefresh,
  onOpenTaskTab,
}: DealSheetQuickActionsProps) {
  const router = useRouter();
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [startingEarly, setStartingEarly] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const { creatorId, creatorReady } = useTaskCreatorId();

  const firstOrder = deal.orders?.[0];
  const projectId = deal.projectId ?? firstOrder?.projectId;
  const taxStatus = deal.taxStatus ?? 'TAX';
  const createInvoiceOrder = firstOrder ? dealOrderToCreateInvoiceOrder(deal, firstOrder) : null;
  const canCreateInvoice = canOpenDealCreateInvoiceDialog(deal, taxStatus);
  const depositBootstrap = canCreateDepositInvoice(deal, taxStatus);

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
    canCreateInvoice,
    canStartEarlyDelivery,
    creatorId,
    creatorReady,
    deal.id,
    depositBootstrap,
    handleStartEarlyDelivery,
    projectId,
    router,
    startingEarly,
  ]);

  return (
    <>
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
