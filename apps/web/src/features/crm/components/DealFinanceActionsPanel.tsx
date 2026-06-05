'use client';

import { useCallback, useMemo, useState } from 'react';
import { CheckSquare, FileText, Plus, Rocket, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickCreateTaskDialog } from '@/components/shared';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import {
  AmdCurrencyIcon,
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import { EntityDriveNavAction } from '@/features/drive/EntityDriveNavAction';
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
import { formatAmount } from '../constants/dealPipeline';
import { computeFinance } from './deal-general-tab.helpers';
import { DealOrderCommercialBadges } from './DealOrderCommercialBadges';
import { getApiErrorMessage } from '@/lib/api-errors';

const FINANCE_PANEL_SURFACE_CLASS =
  'rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-transparent';

const FINANCE_VALUE_TOTAL_CLASS = 'font-bold text-emerald-600 dark:text-emerald-400';
const FINANCE_VALUE_PARTNER_CLASS = 'font-bold text-orange-500 dark:text-orange-400';
const FINANCE_VALUE_REVENUE_CLASS = 'font-bold text-sky-600 dark:text-sky-400';
const FINANCE_VALUE_TO_RECEIVE_DUE_CLASS = 'font-bold text-amber-600 dark:text-amber-400';
const FINANCE_VALUE_TO_RECEIVE_CLEAR_CLASS = 'font-bold text-emerald-600 dark:text-emerald-400';

interface DealFinanceActionsPanelProps {
  deal: Deal;
  projectId: string | undefined;
  firstOrder: Deal['orders'][number] | undefined;
  taxStatus: string;
  onRefresh?: () => void;
  onOpenTaskTab?: () => void;
}

export function DealFinanceActionsPanel({
  deal,
  projectId,
  firstOrder,
  taxStatus,
  onRefresh,
  onOpenTaskTab,
}: DealFinanceActionsPanelProps) {
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [startingEarly, setStartingEarly] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const { creatorId, creatorReady } = useTaskCreatorId();
  const finance = computeFinance(deal);
  const defaultLinks = useMemo(
    () => (projectId ? getTaskLinks(deal.id, projectId) : undefined),
    [deal.id, projectId],
  );

  const createInvoiceOrder = firstOrder ? dealOrderToCreateInvoiceOrder(deal, firstOrder) : null;
  const canCreateInvoice = canOpenDealCreateInvoiceDialog(deal, taxStatus);
  const depositBootstrap = canCreateDepositInvoice(deal, taxStatus);

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

  const handleStartEarlyDelivery = async () => {
    if (!canStartEarlyDelivery) return;
    setStartingEarly(true);
    setActionError(null);
    try {
      await dealsApi.startEarlyDelivery(deal.id);
      onRefresh?.();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Could not start early delivery.'));
    } finally {
      setStartingEarly(false);
    }
  };

  return (
    <>
      <section className={FINANCE_PANEL_SURFACE_CLASS}>
        <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
          <TrendingUp size={12} />
          Finance
        </h4>
        {firstOrder ? <DealOrderCommercialBadges order={firstOrder} /> : null}
        <div className="space-y-2.5 text-sm">
          <FinanceRow
            label="Total"
            value={finance.total > 0 ? formatAmount(finance.total) : '—'}
            valueClassName={FINANCE_VALUE_TOTAL_CLASS}
          />
          {finance.isFromPartner && (
            <FinanceRow
              label={`Partner ${finance.commissionPercentUsed}%`}
              value={`-${formatAmount(finance.partnerAmount)}`}
              valueClassName={FINANCE_VALUE_PARTNER_CLASS}
            />
          )}
          <FinanceRow
            label="Revenue"
            value={finance.revenue > 0 ? formatAmount(finance.revenue) : '—'}
            valueClassName={FINANCE_VALUE_REVENUE_CLASS}
          />
          <FinanceRow
            label="To Receive"
            value={formatAmount(finance.toReceive)}
            valueClassName={
              finance.toReceive > 0
                ? FINANCE_VALUE_TO_RECEIVE_DUE_CLASS
                : FINANCE_VALUE_TO_RECEIVE_CLEAR_CLASS
            }
          />
        </div>
      </section>

      <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
        <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
          <FileText size={12} />
          Actions
        </h4>
        <div className="space-y-3">
          {canCreateInvoice ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              onClick={() => setCreateInvoiceOpen(true)}
            >
              <Plus size={14} />
              {depositBootstrap ? 'Create Deposit Invoice' : 'Create Invoice'}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center gap-1.5 border-stone-300 text-stone-500 dark:border-stone-600 dark:text-stone-400"
              disabled
              title="Fill required: Cost, Payment Type, Contact, Deal Type, Tax Status; if Tax then Company"
            >
              <Plus size={14} />
              Create Invoice
            </Button>
          )}

          {canStartEarlyDelivery ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
              disabled={startingEarly}
              onClick={handleStartEarlyDelivery}
            >
              <Rocket size={14} />
              Start delivery before payment
            </Button>
          ) : null}

          {projectId ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center gap-1.5 border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/30"
              disabled={creatorReady && !creatorId}
              title={creatorReady && !creatorId ? 'Employee profile required' : undefined}
              onClick={() => setQuickCreateOpen(true)}
            >
              <CheckSquare size={14} />
              Create Task
            </Button>
          ) : null}

          <EntityDriveNavAction
            href={buildDriveHrefWithDeal(deal.id)}
            label="Open Drive"
            variant="block"
          />

          {actionError ? <p className="text-destructive text-xs">{actionError}</p> : null}
        </div>
      </section>

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

function FinanceRow({
  label,
  value,
  valueClassName = FINANCE_VALUE_TOTAL_CLASS,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  const showCurrency = value !== '—';

  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('flex items-center justify-end gap-1 tabular-nums', valueClassName)}>
        {showCurrency ? <AmdCurrencyIcon className={valueClassName} /> : null}
        {value}
      </span>
    </div>
  );
}

function getTaskLinks(dealId: string, projectId: string) {
  return [
    { entityType: 'DEAL', entityId: dealId },
    { entityType: 'PROJECT', entityId: projectId },
  ];
}
