'use client';

import { useEffect, useState } from 'react';
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
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
} from '@/features/finance/constants/client-services';
import {
  EMPTY_CLIENT_SERVICE_FORM,
  clientServiceFormToPayload,
  type ClientServiceFormState,
} from '@/features/finance/utils/client-service-form-state';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ClientServiceFormFooter, ClientServiceSelectField } from './client-service-form-controls';
import { useClientServiceProjects } from './use-client-service-projects';

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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const projects = useClientServiceProjects(open);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setForm({ ...EMPTY_CLIENT_SERVICE_FORM });
  }, [open]);

  const canSubmit = Boolean(form.projectId && form.name.trim());

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New client service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
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
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
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
