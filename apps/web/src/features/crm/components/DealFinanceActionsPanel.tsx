'use client';

import { useState } from 'react';
import { FileText, TrendingUp } from 'lucide-react';
import type { Deal } from '@/lib/api/deals';
import { invoicesApi, ordersApi } from '@/lib/api/finance';
import { tasksApi } from '@/lib/api/tasks';
import { formatAmount } from '../constants/dealPipeline';
import { DisabledInvoiceAction, InvoiceAction, TaskAction } from './DealActionControls';
import { computeFinance, PARTNER_PERCENT } from './deal-general-tab.helpers';

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
      <section className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-transparent">
        <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <TrendingUp size={12} />
          Finance
        </h4>
        <div className="space-y-2.5 text-sm">
          <FinanceRow label="Total" value={finance.total > 0 ? formatAmount(finance.total) : '—'} />
          {finance.isFromPartner && (
            <FinanceRow
              label={`Partner ${PARTNER_PERCENT}%`}
              value={`-${formatAmount(finance.partnerAmount)}`}
              valueClassName="text-orange-500 dark:text-orange-400"
            />
          )}
          <FinanceRow
            label="Revenue"
            value={finance.revenue > 0 ? formatAmount(finance.revenue) : '—'}
            valueClassName="text-sky-600 dark:text-sky-400"
          />
          <FinanceRow
            label="To Receive"
            value={formatAmount(finance.toReceive)}
            valueClassName={
              finance.toReceive > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border-2 border-stone-300 bg-stone-100/80 p-4 dark:border-stone-600 dark:bg-stone-800/50">
        <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
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
        </div>
      </section>
    </>
  );
}

function FinanceRow({
  label,
  value,
  valueClassName = 'text-emerald-600 dark:text-emerald-400',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold tabular-nums ${valueClassName}`}>{value}</span>
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
