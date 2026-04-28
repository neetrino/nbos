'use client';

import { useState } from 'react';
import { Calendar, DollarSign, FolderKanban, Handshake } from 'lucide-react';
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
import {
  formatAmount,
  getSubscriptionStatus,
  getSubscriptionType,
} from '@/features/finance/constants/finance';
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
}: SubscriptionsTableProps) {
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [holdTarget, setHoldTarget] = useState<Subscription | null>(null);
  const [partnerTarget, setPartnerTarget] = useState<Subscription | null>(null);

  return (
    <>
      <div className="border-border overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount/mo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Billing Day</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
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
            /* Error surfaced via page ErrorState; keep dialog open for retry. */
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
            /* Error surfaced via page ErrorState; keep dialog open for retry. */
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
}: {
  subscription: Subscription;
  activatingId: string | null;
  cancellingId: string | null;
  holdingId: string | null;
  onActivate: (subscription: Subscription) => void;
  onOpenCancelDialog: () => void;
  onOpenHoldDialog: () => void;
  onOpenPartnerDialog: () => void;
}) {
  const subscriptionType = getSubscriptionType(subscription.type);
  const subscriptionStatus = getSubscriptionStatus(subscription.status);
  const opLock = activatingId ?? cancellingId ?? holdingId;
  const isLockedOut = Boolean(opLock && opLock !== subscription.id);
  const isActivating = activatingId === subscription.id;
  const isCancelling = cancellingId === subscription.id;
  const isHolding = holdingId === subscription.id;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <FolderKanban size={14} className="text-muted-foreground" />
          <span className="font-medium">{subscription.project?.name ?? 'N/A'}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {subscription.company?.name ?? '-'}
      </TableCell>
      <TableCell>
        <div className="flex max-w-[200px] flex-col gap-1">
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
      <SubscriptionAmountCell amount={subscription.amount} />
      <SubscriptionStatusCell subscriptionStatus={subscriptionStatus} />
      <TableCell className="text-muted-foreground text-xs">
        {subscription.coverage?.activeMonthCount ?? 0} months
      </TableCell>
      <SubscriptionBillingCell billingDay={subscription.billingDay} />
      <TableCell className="text-muted-foreground text-xs">
        {new Date(subscription.startDate).toLocaleDateString()}
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
    <TableCell>
      {subscriptionType && (
        <StatusBadge label={subscriptionType.label} variant={subscriptionType.variant} />
      )}
    </TableCell>
  );
}

function SubscriptionAmountCell({ amount }: { amount: string }) {
  return (
    <TableCell className="text-right">
      <span className="flex items-center justify-end gap-1 font-semibold">
        <DollarSign size={12} className="text-accent" />
        {formatAmount(parseFloat(amount))}
      </span>
    </TableCell>
  );
}

function SubscriptionStatusCell({
  subscriptionStatus,
}: {
  subscriptionStatus?: ReturnType<typeof getSubscriptionStatus>;
}) {
  return (
    <TableCell>
      {subscriptionStatus && (
        <StatusBadge label={subscriptionStatus.label} variant={subscriptionStatus.variant} />
      )}
    </TableCell>
  );
}

function SubscriptionBillingCell({ billingDay }: { billingDay: number }) {
  return (
    <TableCell className="text-sm">
      <div className="flex items-center gap-1">
        <Calendar size={12} className="text-muted-foreground" />
        {billingDay}th
      </div>
    </TableCell>
  );
}
