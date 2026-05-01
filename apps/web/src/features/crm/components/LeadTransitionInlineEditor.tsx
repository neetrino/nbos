'use client';

import { useMemo, useState } from 'react';
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
import { LEAD_SOURCES, MARKETING_CHANNELS, SALES_CHANNELS } from '../constants/leadPipeline';

type LeadInlinePayload = Pick<
  Lead,
  | 'contactName'
  | 'phone'
  | 'email'
  | 'source'
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
  source: string;
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
  const [touchedRequiredFields, setTouchedRequiredFields] = useState<Set<string>>(new Set());

  const errorFields = useMemo(() => new Set(errors.map((error) => error.field)), [errors]);
  const needsContactMethod = errorFields.has('contactMethod');
  const whereOptions = getWhereOptions(form.source);
  const showWhereField = whereOptions.length > 0;
  const showMarketingAttribution =
    errorFields.has('whichOne') ||
    errorFields.has('marketingAccountId') ||
    Boolean(form.sourceDetail);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => normalizeFormUpdate(current, field, value));
  };

  const submit = async () => {
    const missing = getMissingFields(form, errors);
    if (missing.length > 0) {
      setTouchedRequiredFields(new Set(missing));
      return;
    }
    await onSubmit(buildChangedPayload(lead, form));
  };

  return (
    <div className="space-y-3">
      {errorFields.has('contactName') && (
        <Field label="Contact name" invalid={touchedRequiredFields.has('contactName')}>
          <Input
            value={form.contactName}
            onChange={(event) => updateForm('contactName', event.target.value)}
            placeholder="Client contact name"
          />
        </Field>
      )}

      {needsContactMethod && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone" invalid={touchedRequiredFields.has('contactMethod')}>
            <Input
              value={form.phone}
              onChange={(event) => updateForm('phone', event.target.value)}
              placeholder="+374..."
            />
          </Field>
          <Field label="Email" invalid={touchedRequiredFields.has('contactMethod')}>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => updateForm('email', event.target.value)}
              placeholder="client@example.com"
            />
          </Field>
        </div>
      )}

      {(errorFields.has('source') || !form.source) && (
        <Field label="From" invalid={touchedRequiredFields.has('source')}>
          <NativeSelect
            value={form.source}
            placeholder="Select source..."
            options={LEAD_SOURCES.map((source) => ({
              value: source.value,
              label: `${source.icon} ${source.label}`,
            }))}
            onChange={(value) => updateForm('source', value)}
          />
        </Field>
      )}

      {showWhereField && (
        <Field label="Where" invalid={touchedRequiredFields.has('sourceDetail')}>
          <NativeSelect
            key={form.source}
            value={form.sourceDetail}
            placeholder="Select channel..."
            options={whereOptions}
            onChange={(value) => updateForm('sourceDetail', value)}
          />
        </Field>
      )}

      {(errorFields.has('sourcePartnerId') || form.source === 'PARTNER') && (
        <Field invalid={touchedRequiredFields.has('sourcePartnerId')}>
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
        </Field>
      )}

      {(errorFields.has('sourceContactId') || form.source === 'CLIENT') && (
        <Field invalid={touchedRequiredFields.has('sourceContactId')}>
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
        </Field>
      )}

      {form.source === 'MARKETING' && showMarketingAttribution && (
        <Field invalid={touchedRequiredFields.has('whichOne')}>
          <SearchField
            label="Which one"
            value={form.marketingAccountId || form.marketingActivityId}
            displayValue={lead.marketingAccount?.name ?? lead.marketingActivity?.title ?? undefined}
            placeholder="Search accounts or activities..."
            onSave={(value) => {
              const [type, id] = value.split(':');
              updateForm('marketingAccountId', type === 'ACCOUNT' ? (id ?? '') : '');
              updateForm('marketingActivityId', type === 'ACTIVITY' ? (id ?? '') : '');
            }}
            onSearch={async (query) => {
              if (!form.sourceDetail) return [];
              const options = await marketingApi.getAttributionOptions(form.sourceDetail);
              return options
                .filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
                .map((option) => ({
                  value: `${option.type}:${option.id}`,
                  label: option.label,
                  subtitle: option.subtitle,
                }));
            }}
          />
        </Field>
      )}

      {errorFields.has('assignedTo') && (
        <Field invalid={touchedRequiredFields.has('assignedTo')}>
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
        </Field>
      )}

      <Button type="button" className="w-full" disabled={saving} onClick={submit}>
        Save and move
      </Button>
    </div>
  );
}

function Field({
  label,
  children,
  invalid = false,
}: {
  label?: string;
  children: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <div className={invalid ? 'rounded-lg border border-red-300 p-2' : 'space-y-1.5'}>
      {label && <Label className={invalid ? 'text-red-600' : undefined}>{label}</Label>}
      {children}
      {invalid && <p className="mt-1 text-xs text-red-600">Required field</p>}
    </div>
  );
}

function NativeSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 py-1 text-sm outline-none focus-visible:ring-3"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function getInitialForm(lead: Lead): FormState {
  return {
    contactName: lead.contactName ?? '',
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    source: lead.source ?? '',
    sourceDetail: lead.sourceDetail ?? '',
    sourcePartnerId: lead.sourcePartnerId ?? '',
    sourceContactId: lead.sourceContactId ?? '',
    marketingAccountId: lead.marketingAccountId ?? '',
    marketingActivityId: lead.marketingActivityId ?? '',
    assignedTo: lead.assignedTo ?? '',
  };
}

function getWhereOptions(source: string) {
  if (source === 'SALES') {
    return SALES_CHANNELS.map((channel) => ({ value: channel.value, label: channel.label }));
  }
  if (source === 'MARKETING') {
    return MARKETING_CHANNELS.map((channel) => ({ value: channel.value, label: channel.label }));
  }
  return [];
}

function normalizeFormUpdate(current: FormState, field: keyof FormState, value: string): FormState {
  const next = { ...current, [field]: value };

  if (field === 'source') {
    next.sourceDetail = '';
    next.sourcePartnerId = '';
    next.sourceContactId = '';
    next.marketingAccountId = '';
    next.marketingActivityId = '';
  }
  if (field === 'sourceDetail') {
    next.marketingAccountId = '';
    next.marketingActivityId = '';
  }
  if (field === 'marketingAccountId' && value) {
    next.marketingActivityId = '';
  }
  if (field === 'marketingActivityId' && value) {
    next.marketingAccountId = '';
  }

  return next;
}

function getMissingFields(form: FormState, errors: ApiFieldError[]): string[] {
  const required = new Set(errors.map((error) => error.field));
  const missing: string[] = [];

  if (required.has('contactName') && !form.contactName.trim()) missing.push('contactName');
  if (required.has('contactMethod') && !form.phone.trim() && !form.email.trim()) {
    missing.push('contactMethod');
  }
  if ((required.has('source') || required.has('sourceDetail')) && !form.source) {
    missing.push('source');
  }
  if (required.has('sourceDetail') && !form.sourceDetail) missing.push('sourceDetail');
  if (required.has('sourcePartnerId') && !form.sourcePartnerId) missing.push('sourcePartnerId');
  if (required.has('sourceContactId') && !form.sourceContactId) missing.push('sourceContactId');
  if (required.has('whichOne') && !form.marketingAccountId && !form.marketingActivityId) {
    missing.push('whichOne');
  }
  if (required.has('assignedTo') && !form.assignedTo) missing.push('assignedTo');

  return missing;
}

function buildChangedPayload(lead: Lead, form: FormState): Partial<LeadInlinePayload> {
  const payload: Partial<LeadInlinePayload> = {};
  assignIfChanged(payload, 'contactName', lead.contactName, form.contactName);
  assignIfChanged(payload, 'phone', lead.phone, form.phone);
  assignIfChanged(payload, 'email', lead.email, form.email);
  assignIfChanged(payload, 'source', lead.source, form.source);
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
