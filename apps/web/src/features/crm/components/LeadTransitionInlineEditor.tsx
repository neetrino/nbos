'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchField } from '@/components/shared';
import { employeesApi } from '@/lib/api/employees';
import { contactsApi } from '@/lib/api/clients';
import { partnersApi } from '@/lib/api/partners';
import { marketingApi } from '@/lib/api/marketing';
import type { Lead } from '@/lib/api/leads';
import type { ApiFieldError } from '@/lib/api-errors';

type LeadInlinePayload = Pick<
  Lead,
  | 'contactName'
  | 'phone'
  | 'email'
  | 'sourceDetail'
  | 'sourcePartnerId'
  | 'sourceContactId'
  | 'marketingAccountId'
  | 'marketingActivityId'
  | 'assignedTo'
>;

interface LeadTransitionInlineEditorProps {
  lead: Lead;
  errors: ApiFieldError[];
  saving: boolean;
  onSubmit: (data: Partial<LeadInlinePayload>) => Promise<void>;
}

interface FormState {
  contactName: string;
  phone: string;
  email: string;
  sourceDetail: string;
  sourcePartnerId: string;
  sourceContactId: string;
  marketingAccountId: string;
  marketingActivityId: string;
  assignedTo: string;
}

export function LeadTransitionInlineEditor({
  lead,
  errors,
  saving,
  onSubmit,
}: LeadTransitionInlineEditorProps) {
  const [form, setForm] = useState<FormState>(() => getInitialForm(lead));

  useEffect(() => {
    setForm(getInitialForm(lead));
  }, [lead]);

  const errorFields = useMemo(() => new Set(errors.map((error) => error.field)), [errors]);
  const needsContactMethod = errorFields.has('contactMethod');

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    await onSubmit(buildChangedPayload(lead, form));
  };

  return (
    <div className="space-y-3 rounded-xl border p-3">
      {errorFields.has('contactName') && (
        <Field label="Contact name">
          <Input
            value={form.contactName}
            onChange={(event) => updateForm('contactName', event.target.value)}
            placeholder="Client contact name"
          />
        </Field>
      )}

      {needsContactMethod && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(event) => updateForm('phone', event.target.value)}
              placeholder="+374..."
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => updateForm('email', event.target.value)}
              placeholder="client@example.com"
            />
          </Field>
        </div>
      )}

      {errorFields.has('sourceDetail') && (
        <Field label="Where">
          <Input
            value={form.sourceDetail}
            onChange={(event) => updateForm('sourceDetail', event.target.value)}
            placeholder="Campaign, page, call context..."
          />
        </Field>
      )}

      {errorFields.has('sourcePartnerId') && (
        <SearchField
          label="Partner"
          value={form.sourcePartnerId}
          displayValue={lead.sourcePartner?.name ?? undefined}
          placeholder="Select partner"
          onSave={(value) => updateForm('sourcePartnerId', value)}
          onSearch={async (query) => {
            const data = await partnersApi.getAll({ pageSize: 20, search: query || undefined });
            return data.items.map((partner) => ({
              value: partner.id,
              label: partner.name,
              subtitle: partner.type,
            }));
          }}
        />
      )}

      {errorFields.has('sourceContactId') && (
        <SearchField
          label="Referral contact"
          value={form.sourceContactId}
          displayValue={
            lead.sourceContact
              ? `${lead.sourceContact.firstName} ${lead.sourceContact.lastName}`
              : undefined
          }
          placeholder="Select contact"
          onSave={(value) => updateForm('sourceContactId', value)}
          onSearch={async (query) => {
            const data = await contactsApi.getAll({ pageSize: 20, search: query || undefined });
            return data.items.map((contact) => ({
              value: contact.id,
              label: `${contact.firstName} ${contact.lastName}`,
              subtitle: contact.email ?? contact.phone ?? undefined,
            }));
          }}
        />
      )}

      {errorFields.has('marketingAccountId') && (
        <SearchField
          label="Marketing account"
          value={form.marketingAccountId}
          displayValue={lead.marketingAccount?.name ?? undefined}
          placeholder="Select account"
          onSave={(value) => updateForm('marketingAccountId', value)}
          onSearch={async (query) => {
            const accounts = await marketingApi.getAccounts({ search: query || undefined });
            return accounts.map((account) => ({
              value: account.id,
              label: account.name,
              subtitle: account.channel,
            }));
          }}
        />
      )}

      {errorFields.has('marketingActivityId') && (
        <SearchField
          label="Marketing activity"
          value={form.marketingActivityId}
          displayValue={lead.marketingActivity?.title ?? undefined}
          placeholder="Select activity"
          onSave={(value) => updateForm('marketingActivityId', value)}
          onSearch={async (query) => {
            const activities = await marketingApi.getActivities({ search: query || undefined });
            return activities.map((activity) => ({
              value: activity.id,
              label: activity.title,
              subtitle: activity.channel,
            }));
          }}
        />
      )}

      {errorFields.has('assignedTo') && (
        <SearchField
          label="Assigned seller"
          value={form.assignedTo}
          displayValue={
            lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : undefined
          }
          placeholder="Select employee"
          onSave={(value) => updateForm('assignedTo', value)}
          onSearch={async (query) => {
            const data = await employeesApi.getAll({ pageSize: 20, search: query || undefined });
            return data.items.map((employee) => ({
              value: employee.id,
              label: `${employee.firstName} ${employee.lastName}`,
              subtitle: employee.position ?? employee.email,
            }));
          }}
        />
      )}

      <Button type="button" disabled={saving} onClick={submit}>
        Save and move
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function getInitialForm(lead: Lead): FormState {
  return {
    contactName: lead.contactName ?? '',
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    sourceDetail: lead.sourceDetail ?? '',
    sourcePartnerId: lead.sourcePartnerId ?? '',
    sourceContactId: lead.sourceContactId ?? '',
    marketingAccountId: lead.marketingAccountId ?? '',
    marketingActivityId: lead.marketingActivityId ?? '',
    assignedTo: lead.assignedTo ?? '',
  };
}

function buildChangedPayload(lead: Lead, form: FormState): Partial<LeadInlinePayload> {
  const payload: Partial<LeadInlinePayload> = {};
  assignIfChanged(payload, 'contactName', lead.contactName, form.contactName);
  assignIfChanged(payload, 'phone', lead.phone, form.phone);
  assignIfChanged(payload, 'email', lead.email, form.email);
  assignIfChanged(payload, 'sourceDetail', lead.sourceDetail, form.sourceDetail);
  assignIfChanged(payload, 'sourcePartnerId', lead.sourcePartnerId, form.sourcePartnerId);
  assignIfChanged(payload, 'sourceContactId', lead.sourceContactId, form.sourceContactId);
  assignIfChanged(payload, 'marketingAccountId', lead.marketingAccountId, form.marketingAccountId);
  assignIfChanged(
    payload,
    'marketingActivityId',
    lead.marketingActivityId,
    form.marketingActivityId,
  );
  assignIfChanged(payload, 'assignedTo', lead.assignedTo, form.assignedTo);
  return payload;
}

function assignIfChanged<TKey extends keyof LeadInlinePayload>(
  payload: Partial<LeadInlinePayload>,
  field: TKey,
  currentValue: LeadInlinePayload[TKey],
  nextValue: string,
) {
  const normalizedNext = nextValue.trim() || null;
  if ((currentValue ?? null) !== normalizedNext) {
    payload[field] = normalizedNext as LeadInlinePayload[TKey];
  }
}
