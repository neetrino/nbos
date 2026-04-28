import type { Subscription } from '@/lib/api/finance';
import { formatAmount } from '@/features/finance/constants/finance';

interface SubscriptionCoverageGridProps {
  subscriptions: Subscription[];
}

const MONTHS = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(new Date().getFullYear(), index);
  return {
    key: index,
    label: date.toLocaleString('en-US', { month: 'short' }),
  };
});

export function SubscriptionCoverageGrid({ subscriptions }: SubscriptionCoverageGridProps) {
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === 'ACTIVE',
  );

  if (activeSubscriptions.length === 0) return null;

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <table className="w-full text-xs">
        <thead className="bg-secondary/50">
          <tr>
            <th className="bg-secondary/50 text-muted-foreground sticky left-0 px-3 py-2 text-left font-medium">
              Project
            </th>
            {MONTHS.map((month) => (
              <th
                key={month.key}
                className="text-muted-foreground px-3 py-2 text-center font-medium"
              >
                {month.label}
              </th>
            ))}
            <th className="text-muted-foreground px-3 py-2 text-right font-medium">Annual</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {activeSubscriptions.map((subscription) => (
            <SubscriptionCoverageRow key={subscription.id} subscription={subscription} />
          ))}
          <SubscriptionCoverageTotalRow subscriptions={activeSubscriptions} />
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionCoverageRow({ subscription }: { subscription: Subscription }) {
  const amount = parseFloat(subscription.amount);
  const firstMonth = getFirstCoveredMonth(subscription);

  return (
    <tr className="hover:bg-secondary/30">
      <td className="bg-card sticky left-0 px-3 py-2 font-medium">
        <div>
          <p>{subscription.project?.name ?? 'N/A'}</p>
          <p className="text-muted-foreground text-[10px]">{formatAmount(amount)}/mo</p>
        </div>
      </td>
      {MONTHS.map((month) => (
        <td key={month.key} className="px-3 py-2 text-center">
          <CoverageMonthCell
            amount={amount}
            isActive={firstMonth !== null && month.key >= firstMonth}
            month={month.key}
          />
        </td>
      ))}
      <td className="px-3 py-2 text-right font-bold">
        {formatAmount(subscription.coverage?.annualizedAmount ?? amount * (12 - (firstMonth ?? 0)))}
      </td>
    </tr>
  );
}

function CoverageMonthCell({
  amount,
  isActive,
  month,
}: {
  amount: number;
  isActive: boolean;
  month: number;
}) {
  if (!isActive) return <span className="text-muted-foreground">-</span>;

  const isPast = month < new Date().getMonth();
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
        isPast
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      }`}
    >
      {formatAmount(amount)}
    </span>
  );
}

function SubscriptionCoverageTotalRow({ subscriptions }: { subscriptions: Subscription[] }) {
  return (
    <tr className="bg-secondary/30 font-bold">
      <td className="bg-secondary/30 sticky left-0 px-3 py-2">Total</td>
      {MONTHS.map((month) => (
        <td key={month.key} className="px-3 py-2 text-center">
          {formatAmount(getMonthTotal(subscriptions, month.key))}
        </td>
      ))}
      <td className="px-3 py-2 text-right">
        {formatAmount(
          subscriptions.reduce(
            (sum, subscription) => sum + (subscription.coverage?.annualizedAmount ?? 0),
            0,
          ),
        )}
      </td>
    </tr>
  );
}

function getMonthTotal(subscriptions: Subscription[], month: number) {
  return subscriptions.reduce((sum, subscription) => {
    const firstMonth = getFirstCoveredMonth(subscription);
    return firstMonth !== null && month >= firstMonth ? sum + parseFloat(subscription.amount) : sum;
  }, 0);
}

function getFirstCoveredMonth(subscription: Subscription) {
  if (!subscription.coverage) return new Date(subscription.startDate).getMonth();
  return subscription.coverage.firstCoveredMonth;
}
