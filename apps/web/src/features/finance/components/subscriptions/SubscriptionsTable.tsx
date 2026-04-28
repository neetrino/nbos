import { Calendar, DollarSign, FolderKanban, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import type { Subscription } from '@/lib/api/finance';
import {
  formatAmount,
  getSubscriptionStatus,
  getSubscriptionType,
} from '@/features/finance/constants/finance';

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
  activatingId: string | null;
  onActivate: (subscription: Subscription) => void;
}

export function SubscriptionsTable({
  subscriptions,
  activatingId,
  onActivate,
}: SubscriptionsTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Company</TableHead>
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
              onActivate={onActivate}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SubscriptionTableRow({
  subscription,
  activatingId,
  onActivate,
}: {
  subscription: Subscription;
  activatingId: string | null;
  onActivate: (subscription: Subscription) => void;
}) {
  const subscriptionType = getSubscriptionType(subscription.type);
  const subscriptionStatus = getSubscriptionStatus(subscription.status);
  const isActivating = activatingId === subscription.id;

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
      <SubscriptionActionCell
        subscription={subscription}
        isActivating={isActivating}
        onActivate={onActivate}
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

function SubscriptionActionCell({
  subscription,
  isActivating,
  onActivate,
}: {
  subscription: Subscription;
  isActivating: boolean;
  onActivate: (subscription: Subscription) => void;
}) {
  if (subscription.status !== 'PENDING') return <TableCell className="text-right" />;

  return (
    <TableCell className="text-right">
      <Button
        size="sm"
        variant="outline"
        disabled={isActivating}
        onClick={() => onActivate(subscription)}
      >
        <PlayCircle size={14} />
        {isActivating ? 'Activating...' : 'Activate'}
      </Button>
    </TableCell>
  );
}
