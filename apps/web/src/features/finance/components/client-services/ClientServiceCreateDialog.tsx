'use client';

import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { CreateFormDialog } from '@/components/shared';
import {
  applyProductToClientServiceForm,
  canSubmitClientServiceCreate,
} from '@/features/finance/utils/client-service-create-form';
import {
  EMPTY_CLIENT_SERVICE_FORM,
  clientServiceFormToPayload,
  type ClientServiceFormState,
} from '@/features/finance/utils/client-service-form-state';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';
import { productsApi } from '@/lib/api/products';
import { getApiErrorMessage } from '@/lib/api-errors';
import { projectDisplayName } from '@/lib/format/project-product-display';
import { ClientServiceCreateDialogFields } from './ClientServiceCreateDialogFields';
import { useClientServicesT } from './client-service-message-keys';
import { useTranslations } from 'next-intl';

interface ClientServiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (service: ClientServiceRecord) => void;
}

export function ClientServiceCreateDialog(props: ClientServiceCreateDialogProps) {
  return <ClientServiceCreateDialogSession key={props.open ? 'open' : 'closed'} {...props} />;
}

function ClientServiceCreateDialogSession({
  open,
  onOpenChange,
  onSaved,
}: ClientServiceCreateDialogProps) {
  const t = useClientServicesT();
  const tCommon = useTranslations('common');
  const [form, setForm] = useState<ClientServiceFormState>({ ...EMPTY_CLIENT_SERVICE_FORM });
  const [productLabel, setProductLabel] = useState<string | null>(null);
  const [projectLabel, setProjectLabel] = useState<string | null>(null);
  const [credentialLabel, setCredentialLabel] = useState<string | null>(null);
  const [productResolving, setProductResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = canSubmitClientServiceCreate(form) && !productResolving;

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('create.title')}
      error={formError}
      submitting={submitting}
      canSubmit={canSubmit}
      submitLabel={t('create.submit')}
      submittingLabel={tCommon('saving')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) =>
        void submitClientService({
          event,
          canSubmit,
          form,
          onSaved,
          onOpenChange,
          setSubmitting,
          setFormError,
          createError: t('errors.create'),
        })
      }
    >
      <ClientServiceCreateDialogFields
        form={form}
        productLabel={productLabel}
        projectLabel={projectLabel}
        credentialLabel={credentialLabel}
        productResolving={productResolving}
        onProductSelect={(id, label) => {
          void handleProductSelect({
            productId: id,
            label,
            setProductLabel,
            setProjectLabel,
            setProductResolving,
            setFormError,
            setForm,
            productProjectError: t('errors.productProject'),
          });
        }}
        onCredentialSelect={(id, label) => {
          setForm((prev) => ({ ...prev, providerAccountId: id }));
          setCredentialLabel(label);
        }}
        onCredentialClear={() => {
          setForm((prev) => ({ ...prev, providerAccountId: '' }));
          setCredentialLabel(null);
        }}
        onFormChange={(partial) => setForm((prev) => ({ ...prev, ...partial }))}
      />
    </CreateFormDialog>
  );
}

async function handleProductSelect(options: {
  productId: string;
  label: string;
  setProductLabel: (label: string | null) => void;
  setProjectLabel: (label: string | null) => void;
  setProductResolving: (resolving: boolean) => void;
  setFormError: (error: string | null) => void;
  setForm: Dispatch<SetStateAction<ClientServiceFormState>>;
  productProjectError: string;
}): Promise<void> {
  options.setProductLabel(options.label);
  options.setProductResolving(true);
  options.setFormError(null);
  try {
    const product = await productsApi.getById(options.productId);
    options.setForm((prev) => applyProductToClientServiceForm(prev, product));
    options.setProjectLabel(projectDisplayName(product.project) ?? product.project.name);
  } catch {
    options.setForm((prev) => ({ ...prev, productId: options.productId, projectId: '' }));
    options.setProjectLabel(null);
    options.setFormError(options.productProjectError);
  } finally {
    options.setProductResolving(false);
  }
}

async function submitClientService(options: {
  event: FormEvent;
  canSubmit: boolean;
  form: ClientServiceFormState;
  onSaved: (service: ClientServiceRecord) => void;
  onOpenChange: (open: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setFormError: (error: string | null) => void;
  createError: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit) return;
  options.setSubmitting(true);
  options.setFormError(null);
  try {
    const saved = await clientServicesApi.create(clientServiceFormToPayload(options.form));
    options.onSaved(saved);
    options.onOpenChange(false);
  } catch (caught) {
    options.setFormError(getApiErrorMessage(caught, options.createError));
  } finally {
    options.setSubmitting(false);
  }
}
