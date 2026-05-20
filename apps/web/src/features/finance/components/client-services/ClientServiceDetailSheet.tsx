'use client';

import { useCallback, useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  ErrorState,
  LoadingState,
  StatusBadge,
  DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS,
} from '@/components/shared';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_FREQUENCIES,
  CLIENT_SERVICE_PRICING_MODELS,
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
import {
  clientServiceFormToPayload,
  clientServiceToFormState,
  parseOptionalAmount,
  type ClientServiceFormState,
} from '@/features/finance/utils/client-service-form-state';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ClientServiceFinanceLinksPanel } from './ClientServiceFinanceLinksPanel';
import {
  ClientServiceDateInput,
  ClientServiceFormFooter,
  ClientServiceMoneyInput,
  ClientServiceSelectField,
} from './client-service-form-controls';
import { useClientServiceProjects } from './use-client-service-projects';

interface ClientServiceDetailSheetProps {
  serviceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ClientServiceDetailSheet({
  serviceId,
  open,
  onOpenChange,
  onSaved,
}: ClientServiceDetailSheetProps) {
  const [service, setService] = useState<ClientServiceRecord | null>(null);
  const [form, setForm] = useState<ClientServiceFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const projects = useClientServiceProjects(open);

  const fetchService = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const row = await clientServicesApi.getById(serviceId);
      setService(row);
      setForm(clientServiceToFormState(row));
      setError(null);
      setFormError(null);
    } catch (caught) {
      setService(null);
      setForm(null);
      setError(getApiErrorMessage(caught, 'Client service could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (!open || !serviceId) return;
    void fetchService();
  }, [open, serviceId, fetchService]);

  if (!serviceId) return null;

  const ourCost = form ? parseOptionalAmount(form.ourCost) : Number.NaN;
  const clientCharge = form ? parseOptionalAmount(form.clientCharge) : Number.NaN;
  const canSubmit =
    Boolean(form?.projectId && form.name.trim()) &&
    !Number.isNaN(ourCost) &&
    !Number.isNaN(clientCharge);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || !serviceId || !canSubmit) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const saved = await clientServicesApi.update(serviceId, clientServiceFormToPayload(form));
      setService(saved);
      setForm(clientServiceToFormState(saved));
      onSaved();
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Client service could not be saved.'));
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabel = service
    ? clientServiceOptionLabel(CLIENT_SERVICE_TYPES, service.type)
    : undefined;
  const statusLabel = service
    ? clientServiceOptionLabel(CLIENT_SERVICE_STATUSES, service.status)
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS}>
        <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : service ? (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                  {service.name}
                </h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {service.project.code} · {service.project.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {typeLabel ? <StatusBadge label={typeLabel} variant="indigo" /> : null}
                {statusLabel ? <StatusBadge label={statusLabel} variant="gray" /> : null}
              </div>
            </div>
          ) : null}
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-7 py-5">
            {loading ? (
              <LoadingState count={3} />
            ) : error ? (
              <ErrorState description={error} onRetry={() => void fetchService()} />
            ) : form ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError ? (
                  <p className="text-destructive text-sm" role="alert">
                    {formError}
                  </p>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                  <ClientServiceSelectField
                    label="Project *"
                    value={form.projectId}
                    options={projects.map((p) => ({
                      value: p.id,
                      label: `${p.code} - ${p.name}`,
                    }))}
                    onChange={(projectId) => projectId && setForm({ ...form, projectId })}
                  />
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <ClientServiceSelectField
                    label="Type"
                    value={form.type}
                    options={CLIENT_SERVICE_TYPES}
                    onChange={(type) => type && setForm({ ...form, type })}
                  />
                  <ClientServiceSelectField
                    label="Status"
                    value={form.status}
                    options={CLIENT_SERVICE_STATUSES}
                    onChange={(status) => status && setForm({ ...form, status })}
                  />
                  <ClientServiceSelectField
                    label="Billing"
                    value={form.billingModel}
                    options={CLIENT_SERVICE_BILLING_MODELS}
                    onChange={(billingModel) => billingModel && setForm({ ...form, billingModel })}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <ClientServiceSelectField
                    label="Pricing"
                    value={form.pricingModel}
                    options={CLIENT_SERVICE_PRICING_MODELS}
                    onChange={(pricingModel) => pricingModel && setForm({ ...form, pricingModel })}
                  />
                  <ClientServiceSelectField
                    label="Frequency"
                    value={form.frequency}
                    options={CLIENT_SERVICE_FREQUENCIES}
                    onChange={(frequency) => frequency && setForm({ ...form, frequency })}
                  />
                  <div>
                    <Label>Provider</Label>
                    <Input
                      value={form.provider}
                      onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <ClientServiceMoneyInput
                    label="Our cost"
                    value={form.ourCost}
                    onChange={(ourCost) => setForm({ ...form, ourCost })}
                  />
                  <ClientServiceMoneyInput
                    label="Client charge"
                    value={form.clientCharge}
                    onChange={(clientCharge) => setForm({ ...form, clientCharge })}
                  />
                  <ClientServiceDateInput
                    label="Start date"
                    value={form.startDate}
                    onChange={(startDate) => setForm({ ...form, startDate })}
                  />
                  <ClientServiceDateInput
                    label="Renewal date"
                    value={form.renewalDate}
                    onChange={(renewalDate) => setForm({ ...form, renewalDate })}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.notificationsEnabled}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, notificationsEnabled: checked === true })
                    }
                  />
                  Renewal notifications enabled
                </label>
                <FinanceProofAttachments
                  entityType="CLIENT_SERVICE_RECORD"
                  entityId={serviceId}
                  purpose="EXPENSE_PROOF"
                  title="Provider receipts & proofs"
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Connections</p>
                  {service?.financeLinks ? (
                    <ClientServiceFinanceLinksPanel links={service.financeLinks} />
                  ) : (
                    <p className="text-muted-foreground text-sm">No linked finance records yet.</p>
                  )}
                </div>
                <ClientServiceFormFooter
                  onCancel={() => onOpenChange(false)}
                  submitting={submitting}
                  canSubmit={canSubmit}
                  submitLabel="Save service"
                />
              </form>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
