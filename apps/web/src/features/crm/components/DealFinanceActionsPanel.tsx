'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, TrendingUp } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import { buildDriveHrefWithDeal } from '@/features/drive/drive-deep-link';
import type { Deal } from '@/lib/api/deals';
import { invoicesApi, ordersApi } from '@/lib/api/finance';
import { tasksApi } from '@/lib/api/tasks';
import { formatAmount } from '../constants/dealPipeline';
import { DisabledInvoiceAction, InvoiceAction, TaskAction } from './DealActionControls';
import { computeFinance } from './deal-general-tab.helpers';

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
  canCreateInvoice: boolean;
  onRefresh?: () => void;
  onOpenTaskTab?: () => void;
}

export function DealFinanceActionsPanel({
  deal,
  projectId,
  firstOrder,
  taxStatus,
  canCreateInvoice,
  onRefresh,
  onOpenTaskTab,
}: DealFinanceActionsPanelProps) {
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const finance = computeFinance(deal);

  const handleCreateInvoice = async () => {
    const amount = Number(invoiceAmount);
    if (!amount || amount <= 0 || !canCreateInvoice || !projectId) return;
    setCreatingInvoice(true);
    try {
      const orderId = await ensureOrder(amount);
      const projectIdForInvoice = firstOrder?.projectId ?? deal.projectId;
      if (!projectIdForInvoice) return;
      await invoicesApi.create({
        orderId,
        projectId: projectIdForInvoice,
        amount,
        type: deal.paymentType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'DEVELOPMENT',
        ...(taxStatus === 'TAX' && deal.companyId && { companyId: deal.companyId }),
      });
      setShowInvoiceForm(false);
      setInvoiceAmount('');
      onRefresh?.();
    } finally {
      setCreatingInvoice(false);
    }
  };

  const ensureOrder = async (amount: number) => {
    if (firstOrder?.id) return firstOrder.id;
    const orderType = getOrderType(deal);
    const order = await ordersApi.create({
      projectId: deal.projectId!,
      dealId: deal.id,
      type: orderType,
      paymentType: deal.paymentType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'CLASSIC',
      totalAmount: amount,
      taxStatus,
    });
    return order.id;
  };

  const handleCreateTask = async () => {
    const title = taskTitle.trim();
    if (!title || !projectId || !deal.seller?.id) return;
    setCreatingTask(true);
    try {
      await tasksApi.create({
        title,
        creatorId: deal.seller.id,
        description: `Deal: ${deal.code} — ${deal.name ?? ''}`.trim(),
        links: getTaskLinks(deal.id, projectId),
      });
      setShowTaskForm(false);
      setTaskTitle('');
      onOpenTaskTab?.();
      onRefresh?.();
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <>
      <section className={FINANCE_PANEL_SURFACE_CLASS}>
        <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
          <TrendingUp size={12} />
          Finance
        </h4>
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
            <InvoiceAction
              showForm={showInvoiceForm}
              invoiceAmount={invoiceAmount}
              creatingInvoice={creatingInvoice}
              setInvoiceAmount={setInvoiceAmount}
              setShowInvoiceForm={setShowInvoiceForm}
              handleCreateInvoice={handleCreateInvoice}
            />
          ) : (
            <DisabledInvoiceAction />
          )}

          {projectId && deal.seller && (
            <TaskAction
              showForm={showTaskForm}
              taskTitle={taskTitle}
              creatingTask={creatingTask}
              setTaskTitle={setTaskTitle}
              setShowTaskForm={setShowTaskForm}
              handleCreateTask={handleCreateTask}
            />
          )}

          <Link
            href={buildDriveHrefWithDeal(deal.id)}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full gap-1.5')}
          >
            <ExternalLink className="size-4" aria-hidden />
            Open Drive
          </Link>
        </div>
      </section>
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
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', valueClassName)}>{value}</span>
    </div>
  );
}

function getOrderType(deal: Deal) {
  if (deal.type === 'EXTENSION') return 'EXTENSION';
  if (deal.paymentType === 'SUBSCRIPTION') return 'SUBSCRIPTION';
  return 'PRODUCT';
}

function getTaskLinks(dealId: string, projectId: string) {
  return [
    { entityType: 'DEAL', entityId: dealId },
    { entityType: 'PROJECT', entityId: projectId },
  ];
}
