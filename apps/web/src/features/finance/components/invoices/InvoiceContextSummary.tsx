'use client';

import { useTranslations } from 'next-intl';
import { formatAmount } from '@/features/finance/constants/finance';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import type { Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import type { CreateInvoiceDialogState } from './use-create-invoice-dialog-state';

type InvoiceCreateTranslator = ReturnType<typeof useTranslations<'invoices'>>;

export function InvoiceContextSummary({
  state,
  order,
  clientServiceContext,
  t,
}: {
  state: CreateInvoiceDialogState;
  order?: Order | null;
  clientServiceContext?: { name: string; projectLabel: string };
  t: InvoiceCreateTranslator;
}) {
  if (order) return <OrderInvoiceContext order={order} t={t} />;
  if (clientServiceContext) {
    return (
      <div className="bg-muted/40 rounded-lg border p-3 text-sm">
        <p className="font-medium">{clientServiceContext.name}</p>
        <p className="text-muted-foreground">{clientServiceContext.projectLabel}</p>
      </div>
    );
  }
  if (state.subscriptionLoading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {t('create.loadingSubscription')}
      </p>
    );
  }
  if (state.loadError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {state.loadError}
      </p>
    );
  }
  if (state.subscriptionDetail) {
    return <SubscriptionInvoiceContext subscription={state.subscriptionDetail} t={t} />;
  }
  return null;
}

function OrderInvoiceContext({ order, t }: { order: Order; t: InvoiceCreateTranslator }) {
  return (
    <div className="bg-muted/40 rounded-lg border p-3 text-sm">
      <p className="font-medium">{getOrderDisplayTitle(order)}</p>
      <p className="text-muted-foreground">
        {order.project.name} · {order.company?.name ?? t('create.noCompany')}
      </p>
      <p className="text-muted-foreground mt-1">
        {t('create.orderTotal', { amount: formatAmount(Number(order.amount)) })}
      </p>
    </div>
  );
}

function SubscriptionInvoiceContext({
  subscription,
  t,
}: {
  subscription: Subscription;
  t: InvoiceCreateTranslator;
}) {
  const displayTitle = getSubscriptionDisplayTitle(subscription);
  const showCodeSubline = displayTitle !== subscription.code;

  return (
    <div className="bg-muted/40 rounded-lg border p-3 text-sm">
      <p className="font-medium">{displayTitle}</p>
      {showCodeSubline ? (
        <p className="text-muted-foreground text-xs">{subscription.code}</p>
      ) : null}
      <p className="text-muted-foreground">
        {subscription.project.name}
        {subscription.company?.name ? ` · ${subscription.company.name}` : ''}
      </p>
      <p className="text-muted-foreground mt-1">
        {t('create.periodAmount', { amount: formatAmount(parseFloat(subscription.amount)) })}
      </p>
    </div>
  );
}
