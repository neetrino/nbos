'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared';
import {
  CreateFormDialog,
  DetailSheetFieldSegmented,
  FormFieldRow,
  InlineField,
} from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import {
  canSubmitDomainPurchase,
  emptyDomainPurchaseDraft,
  type DomainPurchaseDraft,
} from '@/features/finance/components/domain-purchase/domain-purchase-form';
import { usePermission } from '@/lib/permissions';
import type { Invoice, Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import { canSubmitCreateInvoice, type CreateInvoiceFormState } from './create-invoice-dialog-utils';
import { CreateInvoiceDomainFields } from './CreateInvoiceDomainFields';
import { InvoiceContextSummary } from './InvoiceContextSummary';
import {
  domainInvoiceSubmitErrorMessage,
  submitDomainPurchaseInvoices,
} from './submit-domain-purchase-invoices';
import {
  useCreateInvoiceDialogState,
  type CreateInvoiceDialogOuterProps,
} from './use-create-invoice-dialog-state';

export type CreateInvoiceDialogProps = CreateInvoiceDialogOuterProps;
type InvoiceCreateMode = 'free' | 'domain';

export function CreateInvoiceDialog(props: CreateInvoiceDialogProps) {
  return <CreateInvoiceDialogSession key={props.open ? 'open' : 'closed'} {...props} />;
}

function CreateInvoiceDialogSession(props: CreateInvoiceDialogProps) {
  const t = useTranslations('invoices');
  const tCs = useTranslations('clientServices');
  const tCommon = useTranslations('common');
  const { can } = usePermission();
  const state = useCreateInvoiceDialogState(props);
  const [mode, setMode] = useState<InvoiceCreateMode>('free');
  const [domainProductId, setDomainProductId] = useState('');
  const [domainProductLabel, setDomainProductLabel] = useState<string | null>(null);
  const [domainDraft, setDomainDraft] = useState<DomainPurchaseDraft>(emptyDomainPurchaseDraft);
  const showDomainPath =
    can('ADD', FINANCE_CLIENT_SERVICES_MODULE) &&
    !props.order &&
    !props.subscriptionId &&
    !props.clientServiceContext &&
    !props.submitOverride;

  const domainMode = showDomainPath && mode === 'domain';
  const subscriptionBlocked = computeSubscriptionBlocked(props.subscriptionId, state);
  const canSubmit = domainMode
    ? Boolean(domainProductId) && canSubmitDomainPurchase(domainDraft, true) && !state.loading
    : canSubmitCreateInvoice(state.form) && !state.loading && !subscriptionBlocked;

  return (
    <CreateFormDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={dialogTitle(t, props.order, state.subscriptionDetail, props.clientServiceContext)}
      description={dialogDescription(
        t,
        props.order,
        props.subscriptionId,
        state.subscriptionDetail,
        props.clientServiceContext,
      )}
      error={state.error}
      submitting={state.loading}
      canSubmit={canSubmit}
      submitLabel={t('create.submit')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={props.forceNestedBackdrop}
      onSubmit={(event) => {
        if (!domainMode) {
          void state.handleSubmit(event);
          return;
        }
        void submitDomainMode(event, {
          productId: domainProductId,
          draft: domainDraft,
          t,
          tCs,
          setLoading: state.setLoading,
          setError: state.setError,
          onCreated: props.onCreated,
          onOpenChange: props.onOpenChange,
        });
      }}
    >
      {showDomainPath ? (
        <DetailSheetFieldSegmented
          label=""
          hideLabel
          ariaLabel={t('create.titleNew')}
          value={mode}
          options={[
            { value: 'free', label: t('create.modeFree') },
            { value: 'domain', label: t('create.modeDomain') },
          ]}
          onValueChange={setMode}
        />
      ) : null}
      {domainMode ? (
        <CreateInvoiceDomainFields
          productId={domainProductId}
          productLabel={domainProductLabel}
          draft={domainDraft}
          productLabelText={t('create.domainProduct')}
          productSearchText={t('create.domainProduct')}
          onProductSelect={(id, label) => {
            setDomainProductId(id);
            setDomainProductLabel(label);
          }}
          onDraftChange={setDomainDraft}
        />
      ) : (
        <>
          <InvoiceContextSummary
            state={state}
            order={props.order}
            clientServiceContext={props.clientServiceContext}
            t={t}
          />
          <InvoiceAmountFields form={state.form} setForm={state.setForm} t={t} />
        </>
      )}
    </CreateFormDialog>
  );
}

async function submitDomainMode(
  event: FormEvent,
  params: {
    productId: string;
    draft: DomainPurchaseDraft;
    t: ReturnType<typeof useTranslations<'invoices'>>;
    tCs: ReturnType<typeof useTranslations<'clientServices'>>;
    setLoading: (value: boolean) => void;
    setError: (value: string | null) => void;
    onCreated: (invoice?: Invoice) => Promise<void> | void;
    onOpenChange: (open: boolean) => void;
  },
): Promise<void> {
  event.preventDefault();
  params.setLoading(true);
  params.setError(null);
  try {
    const created = await submitDomainPurchaseInvoices({
      productId: params.productId,
      draft: params.draft,
      fallbackError: params.t('create.createError'),
      invoicesCreatedLabel: params.tCs('domainPurchase.invoicesCreated'),
      partialFailureLabel: params.tCs('domainPurchase.partialFailure'),
    });
    await params.onCreated(created ?? undefined);
    if (created) params.onOpenChange(false);
  } catch (caught) {
    params.setError(domainInvoiceSubmitErrorMessage(caught, params.t('create.createError')));
  } finally {
    params.setLoading(false);
  }
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
  state: Pick<
    ReturnType<typeof useCreateInvoiceDialogState>,
    'subscriptionLoading' | 'loadError' | 'subscriptionDetail'
  >,
) {
  if (!subscriptionId?.trim()) return false;
  return state.subscriptionLoading || state.loadError !== null || !state.subscriptionDetail;
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
