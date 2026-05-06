'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_FREQUENCIES,
  CLIENT_SERVICE_PRICING_MODELS,
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
} from '@/features/finance/constants/client-services';
import {
  EMPTY_CLIENT_SERVICE_FORM,
  clientServiceToFormState,
  parseOptionalAmount,
  type ClientServiceFormState,
} from '@/features/finance/utils/client-service-form-state';
import {
  clientServicesApi,
  type ClientServiceRecord,
  type ClientServiceRecordPayload,
} from '@/lib/api/client-services';
import { projectsApi, type Project } from '@/lib/api/projects';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ClientServiceFinanceLinksPanel } from './ClientServiceFinanceLinksPanel';

const PROJECTS_PAGE_SIZE = 100;

interface ClientServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceToEdit?: ClientServiceRecord | null;
  onSaved: (service: ClientServiceRecord) => void;
}

function toPayload(form: ClientServiceFormState): ClientServiceRecordPayload {
  return {
    projectId: form.projectId,
    type: form.type,
    name: form.name.trim(),
    provider: form.provider.trim() || null,
    status: form.status,
    billingModel: form.billingModel,
    pricingModel: form.pricingModel,
    frequency: form.frequency,
    ourCost: parseOptionalAmount(form.ourCost),
    clientCharge: parseOptionalAmount(form.clientCharge),
    taxStatus: form.taxStatus,
    notificationsEnabled: form.notificationsEnabled,
    startDate: form.startDate || null,
    renewalDate: form.renewalDate || null,
    notes: form.notes.trim() || null,
  };
}

export function ClientServiceDialog({
  open,
  onOpenChange,
  serviceToEdit = null,
  onSaved,
}: ClientServiceDialogProps) {
  const [form, setForm] = useState<ClientServiceFormState>({ ...EMPTY_CLIENT_SERVICE_FORM });
  const [projects, setProjects] = useState<Project[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [linkDetail, setLinkDetail] = useState<ClientServiceRecord | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setForm(
      serviceToEdit ? clientServiceToFormState(serviceToEdit) : { ...EMPTY_CLIENT_SERVICE_FORM },
    );
  }, [open, serviceToEdit]);

  useEffect(() => {
    if (!open || !serviceToEdit?.id) {
      setLinkDetail(null);
      return;
    }
    let cancelled = false;
    setLinksLoading(true);
    clientServicesApi
      .getById(serviceToEdit.id)
      .then((row) => {
        if (!cancelled) setLinkDetail(row);
      })
      .catch(() => {
        if (!cancelled) setLinkDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLinksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, serviceToEdit?.id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    projectsApi
      .getAll({ page: 1, pageSize: PROJECTS_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setProjects(res.items);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const ourCost = parseOptionalAmount(form.ourCost);
  const clientCharge = parseOptionalAmount(form.clientCharge);
  const canSubmit =
    Boolean(form.projectId && form.name.trim()) &&
    !Number.isNaN(ourCost) &&
    !Number.isNaN(clientCharge);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = toPayload(form);
      const saved = serviceToEdit
        ? await clientServicesApi.update(serviceToEdit.id, payload)
        : await clientServicesApi.create(payload);
      onSaved(saved);
      onOpenChange(false);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Client service could not be saved.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{serviceToEdit ? 'Edit client service' : 'New client service'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Project *</Label>
              <Select
                value={form.projectId}
                onValueChange={(projectId) => setForm({ ...form, projectId: projectId ?? '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.code} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <SelectField
              label="Type"
              value={form.type}
              options={CLIENT_SERVICE_TYPES}
              onChange={(type) => type && setForm({ ...form, type })}
            />
            <SelectField
              label="Status"
              value={form.status}
              options={CLIENT_SERVICE_STATUSES}
              onChange={(status) => status && setForm({ ...form, status })}
            />
            <SelectField
              label="Billing"
              value={form.billingModel}
              options={CLIENT_SERVICE_BILLING_MODELS}
              onChange={(billingModel) => billingModel && setForm({ ...form, billingModel })}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <SelectField
              label="Pricing"
              value={form.pricingModel}
              options={CLIENT_SERVICE_PRICING_MODELS}
              onChange={(pricingModel) => pricingModel && setForm({ ...form, pricingModel })}
            />
            <SelectField
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
            <MoneyInput
              label="Our cost"
              value={form.ourCost}
              onChange={(ourCost) => setForm({ ...form, ourCost })}
            />
            <MoneyInput
              label="Client charge"
              value={form.clientCharge}
              onChange={(clientCharge) => setForm({ ...form, clientCharge })}
            />
            <DateInput
              label="Start date"
              value={form.startDate}
              onChange={(startDate) => setForm({ ...form, startDate })}
            />
            <DateInput
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
          {serviceToEdit ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Connections</p>
              {linksLoading ? (
                <p className="text-muted-foreground text-sm">Loading linked records…</p>
              ) : linkDetail?.financeLinks ? (
                <ClientServiceFinanceLinksPanel links={linkDetail.financeLinks} />
              ) : (
                <p className="text-muted-foreground text-sm">Links could not be loaded.</p>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? 'Saving...' : 'Save service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MoneyInput(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Input
        inputMode="decimal"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

function DateInput(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Input
        type="date"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}
