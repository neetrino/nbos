'use client';

import { useTranslations } from 'next-intl';
import { CreateFormDialog, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { formatAmount } from '@/features/finance/constants/finance';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import type { Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import { canSubmitCreateInvoice, type CreateInvoiceFormState } from './create-invoice-dialog-utils';
import {
  useCreateInvoiceDialogState,
  type CreateInvoiceDialogOuterProps,
  type CreateInvoiceDialogState,
} from './use-create-invoice-dialog-state';

export type CreateInvoiceDialogProps = CreateInvoiceDialogOuterProps;

export function CreateInvoiceDialog(props: CreateInvoiceDialogProps) {
  const t = useTranslations('invoices');
  const tCommon = useTranslations('common');
  const state = useCreateInvoiceDialogState(props);
  const subscriptionBlocked = computeSubscriptionBlocked(props.subscriptionId, state);
  const canSubmit = canSubmitCreateInvoice(state.form) && !state.loading && !subscriptionBlocked;
  const description = dialogDescription(
    t,
    props.order,
    props.subscriptionId,
    state.subscriptionDetail,
    props.clientServiceContext,
  );

  return (
    <CreateFormDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={dialogTitle(t, props.order, state.subscriptionDetail, props.clientServiceContext)}
      description={description}
      error={state.error}
      submitting={state.loading}
      canSubmit={canSubmit}
      submitLabel={t('create.submit')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={props.forceNestedBackdrop}
      onSubmit={(event) => void state.handleSubmit(event)}
    >
      <InvoiceContextSummary
        state={state}
        order={props.order}
        clientServiceContext={props.clientServiceContext}
        t={t}
      />
      <InvoiceAmountFields form={state.form} setForm={state.setForm} t={t} />
    </CreateFormDialog>
  );
}

type InvoiceCreateTranslator = ReturnType<typeof useTranslations<'invoices'>>;

function dialogTitle(
  t: InvoiceCreateTranslator,
  order: Order | null | undefined,
  subscriptionDetail: Subscription | null,
  clientServiceContext?: { name: string; projectLabel: string },
) {
  if (order) return t('create.titleOrder');
  if (subscriptionDetail) return t('create.titleSubscription');
  if (clientServiceContext) return t('create.titleGeneric');
  return t('create.titleNew');
}

function dialogDescription(
  t: InvoiceCreateTranslator,
  order: Order | null | undefined,
  subscriptionId: string | null | undefined,
  subscriptionDetail: Subscription | null,
  clientServiceContext?: { name: string; projectLabel: string },
) {
  if (order) return t('create.descriptionOrder', { title: getOrderDisplayTitle(order) });
  if (subscriptionDetail) {
    return t('create.descriptionSubscription', {
      title: getSubscriptionDisplayTitle(subscriptionDetail),
    });
  }
  if (subscriptionId) return t('create.loadingSubscriptionContext');
  if (clientServiceContext) {
    return t('create.descriptionClientService', {
      name: clientServiceContext.name,
      project: clientServiceContext.projectLabel,
    });
  }
  return null;
}

function computeSubscriptionBlocked(
  subscriptionId: string | null | undefined,
  state: Pick<CreateInvoiceDialogState, 'subscriptionLoading' | 'loadError' | 'subscriptionDetail'>,
) {
  if (!subscriptionId?.trim()) return false;
  return state.subscriptionLoading || state.loadError !== null || !state.subscriptionDetail;
}

function InvoiceContextSummary({
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

function InvoiceAmountFields({
  form,
  setForm,
  t,
}: {
  form: CreateInvoiceFormState;
  setForm: (form: CreateInvoiceFormState) => void;
  t: InvoiceCreateTranslator;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('create.amount')}
          type="money"
          value={form.amount}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(amount) => setForm({ ...form, amount })}
        />
        <InlineField
          variant="controlled"
          label={t('create.dueDate')}
          type="date"
          value={form.dueDate}
          datePickerVariant="extended"
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(dueDate) => setForm({ ...form, dueDate })}
        />
      </FormFieldRow>
      <p className="text-muted-foreground text-xs">{t('create.dueDateHint')}</p>
    </div>
  );
}
