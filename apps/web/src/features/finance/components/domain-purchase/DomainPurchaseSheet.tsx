'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreateFormDialog } from '@/components/shared';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import { getApiErrorMessage } from '@/lib/api-errors';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';
import { productsApi, type FullProduct } from '@/lib/api/products';
import { DomainPurchaseAssignments } from './DomainPurchaseAssignments';
import { DomainPurchaseFormFields } from './DomainPurchaseFormFields';
import { DomainPurchaseServiceList } from './DomainPurchaseServiceList';
import {
  canSubmitDomainPurchase,
  emptyDomainPurchaseDraft,
  toDomainOperationPayload,
  type DomainPurchaseDraft,
} from './domain-purchase-form';

interface DomainPurchaseSheetProps {
  open: boolean;
  productId: string;
  services: readonly ClientServiceRecord[];
  canAdd: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onOpenService: (serviceId: string) => void;
}

export function DomainPurchaseSheet({
  open,
  productId,
  services,
  canAdd,
  onOpenChange,
  onSaved,
  onOpenService,
}: DomainPurchaseSheetProps) {
  return (
    <DomainPurchaseSheetSession
      key={open ? `${productId}-open` : 'closed'}
      open={open}
      productId={productId}
      services={services}
      canAdd={canAdd}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      onOpenService={onOpenService}
    />
  );
}

function DomainPurchaseSheetSession({
  open,
  productId,
  services,
  canAdd,
  onOpenChange,
  onSaved,
  onOpenService,
}: DomainPurchaseSheetProps) {
  const t = useClientServicesT();
  const tCommon = useTranslations('common');
  const [draft, setDraft] = useState<DomainPurchaseDraft>(emptyDomainPurchaseDraft);
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void productsApi
      .getById(productId)
      .then(setProduct)
      .catch(() => setProduct(null));
  }, [open, productId]);

  const canSubmit = canAdd && canSubmitDomainPurchase(draft, false) && !submitting;

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('domainPurchase.title')}
      error={error}
      submitting={submitting}
      canSubmit={canSubmit}
      submitLabel={t('domainPurchase.save')}
      submittingLabel={t('domainPurchase.saving')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop
      onSubmit={(event) =>
        void submitDomainPurchase({
          event,
          canSubmit,
          productId,
          draft,
          t,
          setSubmitting,
          setError,
          onOpenChange,
          onSaved,
        })
      }
    >
      <DomainPurchaseServiceList services={services} onOpenService={onOpenService} />
      {canAdd ? (
        <>
          <DomainPurchaseAssignments product={product} onProductUpdated={setProduct} />
          <DomainPurchaseFormFields
            draft={draft}
            projectId={product?.projectId ?? null}
            onChange={setDraft}
          />
        </>
      ) : null}
    </CreateFormDialog>
  );
}

async function submitDomainPurchase(params: {
  event: FormEvent;
  canSubmit: boolean;
  productId: string;
  draft: DomainPurchaseDraft;
  t: ReturnType<typeof useClientServicesT>;
  setSubmitting: (value: boolean) => void;
  setError: (value: string | null) => void;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}): Promise<void> {
  params.event.preventDefault();
  if (!params.canSubmit) return;
  params.setSubmitting(true);
  params.setError(null);
  try {
    const result = await clientServicesApi.startDomainOperation(
      toDomainOperationPayload(params.productId, params.draft, false),
    );
    const failed = result.items.filter((item) => item.status === 'failed');
    if (failed.length > 0) {
      params.setError(
        failed.map((item) => item.message ?? item.domainName).join(' ') ||
          params.t('domainPurchase.partialFailure'),
      );
      params.onSaved();
      return;
    }
    toast.success(params.t('domainPurchase.saved'));
    params.onSaved();
    params.onOpenChange(false);
  } catch (caught) {
    params.setError(getApiErrorMessage(caught, params.t('domainPurchase.partialFailure')));
  } finally {
    params.setSubmitting(false);
  }
}
