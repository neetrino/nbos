'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Building2, Calendar, FileText, FolderKanban, Handshake } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import type { Subscription } from '@/lib/api/finance';
import { getSubscriptionStatus, getSubscriptionType } from '@/features/finance/constants/finance';
import { subscriptionInvoicesDrilldownHref } from '@/features/finance/constants/subscription-invoice-drilldown';
import {
  FINANCE_LIST_BADGE_CLASS,
  FINANCE_LIST_CELL_CLASS,
  FINANCE_LIST_HEAD_CLASS,
  FINANCE_LIST_ROW_HOVER_CLASS,
  FINANCE_LIST_SHELL_CLASS,
  FinanceListAmount,
  FinanceListDate,
  FinanceListIconLabel,
  FinanceListMutedDash,
} from '@/features/finance/components/shared/finance-list-table';
import { SubscriptionCancelDialog } from './SubscriptionCancelDialog';
import { SubscriptionHoldDialog } from './SubscriptionHoldDialog';
import { SubscriptionPartnerDialog } from './SubscriptionPartnerDialog';
import { SubscriptionTableActionCell } from './SubscriptionTableActionCell';

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
  activatingId: string | null;
  cancellingId: string | null;
  holdingId: string | null;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => Promise<void>;
  onHold: (subscription: Subscription) => Promise<void>;
  onPartnerLinked: (subscription: Subscription) => void;
  onOpenSubscription: (subscriptionId: string) => void;
}

export function SubscriptionsTable({
  subscriptions,
  activatingId,
  cancellingId,
  holdingId,
  onActivate,
  onCancel,
  onHold,
  onPartnerLinked,
  onOpenSubscription,
}: SubscriptionsTableProps) {
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [holdTarget, setHoldTarget] = useState<Subscription | null>(null);
  const [partnerTarget, setPartnerTarget] = useState<Subscription | null>(null);

  return (
    <>
      <div className={FINANCE_LIST_SHELL_CLASS}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Project</TableHead>
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Company</TableHead>
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Partner</TableHead>
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Type</TableHead>
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Amount/mo</TableHead>
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Status</TableHead>
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Coverage</TableHead>
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Billing Day</TableHead>
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Start Date</TableHead>
              <TableHead className={FINANCE_LIST_HEAD_CLASS}>Invoices</TableHead>
              <TableHead className={`${FINANCE_LIST_HEAD_CLASS} text-right`}>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <SubscriptionTableRow
                key={subscription.id}
                subscription={subscription}
                activatingId={activatingId}
                cancellingId={cancellingId}
                holdingId={holdingId}
                onActivate={onActivate}
                onOpenCancelDialog={() => setCancelTarget(subscription)}
                onOpenHoldDialog={() => setHoldTarget(subscription)}
                onOpenPartnerDialog={() => setPartnerTarget(subscription)}
                onOpenSubscription={onOpenSubscription}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <SubscriptionCancelDialog
        subscription={cancelTarget}
        open={cancelTarget !== null}
        isSubmitting={Boolean(cancellingId && cancelTarget && cancellingId === cancelTarget.id)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onConfirm={async () => {
          if (!cancelTarget) return;
          try {
            await onCancel(cancelTarget);
            setCancelTarget(null);
          } catch {
            /* Error surfaced via list mutation banner; keep dialog open for retry. */
          }
        }}
      />
      <SubscriptionHoldDialog
        subscription={holdTarget}
        open={holdTarget !== null}
        isSubmitting={Boolean(holdingId && holdTarget && holdingId === holdTarget.id)}
        onOpenChange={(open) => {
          if (!open) setHoldTarget(null);
        }}
        onConfirm={async () => {
          if (!holdTarget) return;
          try {
            await onHold(holdTarget);
            setHoldTarget(null);
          } catch {
            /* Error surfaced via list mutation banner; keep dialog open for retry. */
          }
        }}
      />
      <SubscriptionPartnerDialog
        subscription={partnerTarget}
        open={partnerTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPartnerTarget(null);
        }}
        onSaved={onPartnerLinked}
      />
    </>
  );
}

function SubscriptionTableRow({
  subscription,
  activatingId,
  cancellingId,
  holdingId,
  onActivate,
  onOpenCancelDialog,
  onOpenHoldDialog,
  onOpenPartnerDialog,
  onOpenSubscription,
}: {
  subscription: Subscription;
  activatingId: string | null;
  cancellingId: string | null;
  holdingId: string | null;
  onActivate: (subscription: Subscription) => void;
  onOpenCancelDialog: () => void;
  onOpenHoldDialog: () => void;
  onOpenPartnerDialog: () => void;
  onOpenSubscription: (subscriptionId: string) => void;
}) {
  const subscriptionType = getSubscriptionType(subscription.type);
  const subscriptionStatus = getSubscriptionStatus(subscription.status);
  const opLock = activatingId ?? cancellingId ?? holdingId;
  const isLockedOut = Boolean(opLock && opLock !== subscription.id);
  const isActivating = activatingId === subscription.id;
  const isCancelling = cancellingId === subscription.id;
  const isHolding = holdingId === subscription.id;

  return (
    <TableRow
      className={FINANCE_LIST_ROW_HOVER_CLASS}
      onClick={() => onOpenSubscription(subscription.id)}
    >
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListIconLabel
          icon={FolderKanban}
          iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
          label={subscription.project?.name ?? 'N/A'}
          labelClassName="font-bold"
        />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {subscription.company?.name ? (
          <FinanceListIconLabel
            icon={Building2}
            iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
            label={subscription.company.name}
          />
        ) : (
          <FinanceListMutedDash />
        )}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <div className="flex max-w-[200px] flex-col gap-1.5">
          <span className="truncate text-sm">{subscription.partner?.name ?? '—'}</span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="w-fit gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPartnerDialog();
            }}
          >
            <Handshake size={12} />
            Link
          </Button>
        </div>
      </TableCell>
      <SubscriptionTypeCell subscriptionType={subscriptionType} />
      <SubscriptionAmountCell amount={subscription.baseMonthlyAmount} />
      <SubscriptionStatusCell subscriptionStatus={subscriptionStatus} />
      <TableCell className={`${FINANCE_LIST_CELL_CLASS} text-muted-foreground text-xs`}>
        {subscription.coverage?.activeMonthCount ?? 0} months
      </TableCell>
      <SubscriptionBillingCell billingDay={subscription.billingDay} />
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListDate value={subscription.billingStartDate} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS} onClick={(event) => event.stopPropagation()}>
        <Link
          href={subscriptionInvoicesDrilldownHref(subscription.id)}
          className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          aria-label="View invoices for this subscription"
        >
          <FileText size={14} />
          Invoices
        </Link>
      </TableCell>
      <SubscriptionTableActionCell
        subscription={subscription}
        isLockedOut={isLockedOut}
        isActivating={isActivating}
        isCancelling={isCancelling}
        isHolding={isHolding}
        onActivate={onActivate}
        onOpenCancelDialog={onOpenCancelDialog}
        onOpenHoldDialog={onOpenHoldDialog}
      />
    </TableRow>
  );
}

function SubscriptionTypeCell({
  subscriptionType,
}: {
  subscriptionType?: ReturnType<typeof getSubscriptionType>;
}) {
  return (
    <TableCell className={FINANCE_LIST_CELL_CLASS}>
      {subscriptionType ? (
        <StatusBadge
          label={subscriptionType.label}
          variant={subscriptionType.variant}
          className={FINANCE_LIST_BADGE_CLASS}
        />
      ) : null}
    </TableCell>
  );
}

function SubscriptionAmountCell({ amount }: { amount: string }) {
  return (
    <TableCell className={FINANCE_LIST_CELL_CLASS}>
      <FinanceListAmount amount={amount} />
    </TableCell>
  );
}

function SubscriptionStatusCell({
  subscriptionStatus,
}: {
  subscriptionStatus?: ReturnType<typeof getSubscriptionStatus>;
}) {
  return (
    <TableCell className={FINANCE_LIST_CELL_CLASS}>
      {subscriptionStatus ? (
        <StatusBadge
          label={subscriptionStatus.label}
          variant={subscriptionStatus.variant}
          className={FINANCE_LIST_BADGE_CLASS}
        />
      ) : null}
    </TableCell>
  );
}

function SubscriptionBillingCell({ billingDay }: { billingDay: number }) {
  return (
    <TableCell className={FINANCE_LIST_CELL_CLASS}>
      <div className="flex items-center gap-1.5 text-sm">
        <Calendar size={12} className="text-muted-foreground shrink-0" aria-hidden />
        {billingDay}th
      </div>
    </TableCell>
  );
}
