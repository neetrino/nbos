'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared';
import { CreateFormDialog, DetailSheetFieldSegmented } from '@/components/shared';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import {
  canSubmitDomainPurchase,
  emptyDomainPurchaseDraft,
  type DomainPurchaseDraft,
} from '@/features/finance/components/domain-purchase/domain-purchase-form';
import { clientServicesApi } from '@/lib/api/client-services';
import { usePermission } from '@/lib/permissions';
import { toDomainOperationPayload } from '@/features/finance/components/domain-purchase/domain-purchase-form';
import type { Invoice, Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import {
  canSubmitCreateInvoice,
  shouldShowStandardInvoiceProductField,
} from './create-invoice-dialog-utils';
import { CreateInvoiceDomainFields } from './CreateInvoiceDomainFields';
import { CreateInvoiceStandardFields } from './CreateInvoiceStandardFields';
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
  const [domainProductId, setDomainProductId] = useState(props.presetDomainProduct?.id ?? '');
  const [domainProductLabel, setDomainProductLabel] = useState<string | null>(
    props.presetDomainProduct?.label ?? null,
  );
  const [domainDraft, setDomainDraft] = useState<DomainPurchaseDraft>(emptyDomainPurchaseDraft());
  const [previewKind, setPreviewKind] = useState<string | null>(null);
  const showDomainPath =
    can('ADD', FINANCE_CLIENT_SERVICES_MODULE) &&
    !props.subscriptionId &&
    !props.clientServiceContext &&
    (props.allowDomainPath || (!props.order && !props.submitOverride));

  const domainMode = showDomainPath && mode === 'domain';
  const showStandardProduct = shouldShowStandardInvoiceProductField(props);
  const productLocked = Boolean(props.hiddenContext?.productId);

  const canPreviewDomain =
    domainMode && Boolean(domainProductId) && Boolean(domainDraft.domains[0]?.domainName.trim());

  useEffect(() => {
    if (!canPreviewDomain || !domainProductId) return;
    let cancelled = false;
    void clientServicesApi
      .previewDomainOperation(toDomainOperationPayload(domainProductId, domainDraft, true))
      .then((result) => {
        if (!cancelled) setPreviewKind(result.items[0]?.kind ?? 'new_purchase');
      })
      .catch(() => {
        if (!cancelled) setPreviewKind(null);
      });
    return () => {
      cancelled = true;
    };
  }, [canPreviewDomain, domainProductId, domainDraft]);
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
      titleAccessory={
        showDomainPath ? (
          <DetailSheetFieldSegmented
            label=""
            hideLabel
            density="compact"
            ariaLabel={t('create.titleNew')}
            value={mode}
            options={[
              { value: 'free', label: t('create.modeFree') },
              { value: 'domain', label: t('create.modeDomain') },
            ]}
            onValueChange={setMode}
          />
        ) : null
      }
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
      {domainMode ? (
        <CreateInvoiceDomainFields
          productId={domainProductId}
          productLabel={domainProductLabel}
          draft={domainDraft}
          productLabelText={t('create.product')}
          productSearchText={t('create.product')}
          amountLabel={t('create.amount')}
          productLocked={Boolean(props.presetDomainProduct?.id)}
          previewKind={canPreviewDomain ? previewKind : null}
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
          <CreateInvoiceStandardFields
            form={state.form}
            setForm={state.setForm}
            t={t}
            showProduct={showStandardProduct}
            productLocked={productLocked}
          />
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
