'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  useEffect(() => {
    setForm(getInitialForm(lead));
  }, [lead]);

  const errorFields = useMemo(() => new Set(errors.map((error) => error.field)), [errors]);
  const needsContactMethod = errorFields.has('contactMethod');
  const whereOptions = getWhereOptions(form.source);
  const showWhereField =
    errorFields.has('sourceDetail') || (Boolean(form.source) && whereOptions.length > 0);
  const showMarketingAttribution =
    errorFields.has('whichOne') ||
    errorFields.has('marketingAccountId') ||
    Boolean(form.sourceDetail);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => normalizeFormUpdate(current, field, value));
  };

  const submit = async () => {
    await onSubmit(buildChangedPayload(lead, form));
  };

  return (
    <div className="space-y-3">
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

      {(errorFields.has('source') || !form.source) && (
        <Field label="From">
          <Select
            value={form.source || undefined}
            onValueChange={(value) => updateForm('source', value ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select source..." />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.icon} {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {showWhereField && (
        <Field label="Where">
          <Select
            value={form.sourceDetail || undefined}
            onValueChange={(value) => updateForm('sourceDetail', value ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select channel..." />
            </SelectTrigger>
            <SelectContent>
              {whereOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {(errorFields.has('sourcePartnerId') || form.source === 'PARTNER') && (
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

      {(errorFields.has('sourceContactId') || form.source === 'CLIENT') && (
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

      {form.source === 'MARKETING' && showMarketingAttribution && (
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

      <Button type="button" className="w-full" disabled={saving} onClick={submit}>
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
