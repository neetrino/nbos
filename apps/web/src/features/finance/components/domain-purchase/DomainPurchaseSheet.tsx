'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreateFormDialog } from '@/components/shared';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import { getApiErrorMessage } from '@/lib/api-errors';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';
import { productsApi, type FullProduct } from '@/lib/api/products';
import { DomainPurchaseFormFields } from './DomainPurchaseFormFields';
import { DomainPurchaseServiceList } from './DomainPurchaseServiceList';
import {
  canSubmitDomainPurchase,
  draftFromExistingServices,
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
  const [draft, setDraft] = useState<DomainPurchaseDraft>(() =>
    draftFromExistingServices(services),
  );
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localServices, setLocalServices] = useState(services);

  useEffect(() => {
    setLocalServices(services);
  }, [services]);

  useEffect(() => {
    if (!open) return;
    void productsApi
      .getById(productId)
      .then(setProduct)
      .catch(() => setProduct(null));
  }, [open, productId]);

  const issueInvoices = draft.connectionMode === 'PURCHASE' && canSubmitDomainPurchase(draft, true);
  const techReady = Boolean(product?.technicalSpecialistId);
  const canSubmit = canAdd && techReady && canSubmitDomainPurchase(draft, false) && !submitting;

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        localServices.length > 0 ? t('domainPurchase.continueTitle') : t('domainPurchase.title')
      }
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
          issueInvoices,
          t,
          setSubmitting,
          setError,
          onOpenChange,
          onSaved,
        })
      }
    >
      <DomainPurchaseServiceList services={localServices} onOpenService={onOpenService} />
      {canAdd && product && !techReady ? (
        <p className="text-destructive text-sm" role="alert">
          {t('domainPurchase.techRequired')}
        </p>
      ) : null}
      {canAdd ? (
        <DomainPurchaseFormFields
          draft={draft}
          projectId={product?.projectId ?? null}
          services={localServices}
          canEditFacts
          onChange={setDraft}
          onServiceUpdated={(updated) =>
            setLocalServices((current) =>
              current.map((row) => (row.id === updated.id ? updated : row)),
            )
          }
        />
      ) : null}
    </CreateFormDialog>
  );
}

async function submitDomainPurchase(params: {
  event: FormEvent;
  canSubmit: boolean;
  productId: string;
  draft: DomainPurchaseDraft;
  issueInvoices: boolean;
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
      toDomainOperationPayload(params.productId, params.draft, params.issueInvoices),
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
