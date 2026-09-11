'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ClientServiceFormFooter } from './client-service-form-controls';

interface ClientServiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (service: ClientServiceRecord) => void;
}

export function ClientServiceCreateDialog({
  open,
  onOpenChange,
  onSaved,
}: ClientServiceCreateDialogProps) {
  const [form, setForm] = useState<ClientServiceFormState>({ ...EMPTY_CLIENT_SERVICE_FORM });
  const [productLabel, setProductLabel] = useState<string | null>(null);
  const [projectLabel, setProjectLabel] = useState<string | null>(null);
  const [credentialLabel, setCredentialLabel] = useState<string | null>(null);
  const [productResolving, setProductResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setProductLabel(null);
    setProjectLabel(null);
    setCredentialLabel(null);
    setProductResolving(false);
    setForm({ ...EMPTY_CLIENT_SERVICE_FORM });
  }, [open]);

  const canSubmit = canSubmitClientServiceCreate(form) && !productResolving;

  const handleProductSelect = async (productId: string, label: string) => {
    setProductLabel(label);
    setProductResolving(true);
    setFormError(null);
    try {
      const product = await productsApi.getById(productId);
      setForm((prev) => applyProductToClientServiceForm(prev, product));
      setProjectLabel(projectDisplayName(product.project) ?? product.project.name);
    } catch {
      setForm((prev) => ({ ...prev, productId, projectId: '' }));
      setProjectLabel(null);
      setFormError('Could not load the product project.');
    } finally {
      setProductResolving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const saved = await clientServicesApi.create(clientServiceFormToPayload(form));
      onSaved(saved);
      onOpenChange(false);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Client service could not be created.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New client service</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
          <ClientServiceCreateDialogFields
            form={form}
            productLabel={productLabel}
            projectLabel={projectLabel}
            credentialLabel={credentialLabel}
            productResolving={productResolving}
            onProductSelect={(id, label) => {
              void handleProductSelect(id, label);
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
          <DialogFooter className="gap-0 sm:justify-end">
            <ClientServiceFormFooter
              onCancel={() => onOpenChange(false)}
              submitting={submitting}
              canSubmit={canSubmit}
              submitLabel="Create service"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
