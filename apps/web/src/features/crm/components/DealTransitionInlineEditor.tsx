'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchField } from '@/components/shared';
import type { Deal } from '@/lib/api/deals';
import type { ApiFieldError } from '@/lib/api-errors';
import { PAYMENT_TYPES, PRODUCT_CATEGORIES, PRODUCT_TYPES } from '../constants/dealPipeline';
import { LEAD_SOURCES, SALES_CHANNELS } from '../constants/leadPipeline';
import { useCrmMarketingWhereOptions } from '../hooks/useCrmMarketingWhereOptions';
import { requiresMarketingWhichOneSelection } from '@nbos/shared/constants';
import { marketingApi } from '@/lib/api/marketing';
import { partnersApi } from '@/lib/api/partners';
import { contactsApi, companiesApi } from '@/lib/api/clients';
import { employeesApi } from '@/lib/api/employees';
import { productsApi } from '@/lib/api/products';

interface DealTransitionInlineEditorProps {
  deal: Deal;
  errors: ApiFieldError[];
  saving: boolean;
  onSaveOnly: (data: Partial<Deal>) => Promise<void>;
  onSaveAndMove: (data: Partial<Deal>) => Promise<void>;
}

interface FormState {
  amount: string;
  paymentType: string;
  productCategory: string;
  productType: string;
  offerSentAt: string;
  offerLink: string;
  offerFileUrl: string;
  offerScreenshotUrl: string;
  contractSignedAt: string;
  contractFileUrl: string;
  source: string;
  sourceDetail: string;
  sourcePartnerId: string;
  sourceContactId: string;
  marketingAccountId: string;
  marketingActivityId: string;
  companyId: string;
  pmId: string;
  deadline: string;
  existingProductId: string;
}

export function DealTransitionInlineEditor({
  deal,
  errors,
  saving,
  onSaveOnly,
  onSaveAndMove,
}: DealTransitionInlineEditorProps) {
  const [form, setForm] = useState<FormState>(() => getInitialForm(deal));
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const errorFields = useMemo(() => new Set(errors.map((error) => error.field)), [errors]);
  const { options: marketingWhereOptions } = useCrmMarketingWhereOptions(
    form.source === 'MARKETING',
  );
  const whereOptions = getWhereOptions(form.source, marketingWhereOptions);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => normalizeFormUpdate(current, field, value));
  };

  const runSubmit = async (mode: 'save' | 'move') => {
    const missing = getMissingFields(form, errorFields);
    if (missing.length > 0) {
      setTouched(new Set(missing));
      return;
    }
    const payload = buildChangedPayload(deal, form);
    if (mode === 'save') {
      await onSaveOnly(payload);
      return;
    }
    await onSaveAndMove(payload);
  };

  return (
    <div className="space-y-3">
      {errorFields.has('amount') && (
        <Field label="Amount" invalid={touched.has('amount')}>
          <Input
            type="number"
            min="0"
            value={form.amount}
            onChange={(event) => updateField('amount', event.target.value)}
            placeholder="Enter amount"
          />
        </Field>
      )}

      {errorFields.has('paymentType') && (
        <Field label="Payment type" invalid={touched.has('paymentType')}>
          <NativeSelect
            value={form.paymentType}
            placeholder="Select payment type..."
            options={PAYMENT_TYPES.map((type) => ({ value: type.value, label: type.label }))}
            onChange={(value) => updateField('paymentType', value)}
          />
        </Field>
      )}

      {(errorFields.has('productCategory') || errorFields.has('productType')) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {errorFields.has('productCategory') && (
            <Field label="Product category" invalid={touched.has('productCategory')}>
              <NativeSelect
                value={form.productCategory}
                placeholder="Select category..."
                options={PRODUCT_CATEGORIES.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                onChange={(value) => updateField('productCategory', value)}
              />
            </Field>
          )}
          {errorFields.has('productType') && (
            <Field label="Product type" invalid={touched.has('productType')}>
              <NativeSelect
                value={form.productType}
                placeholder="Select product type..."
                options={PRODUCT_TYPES.map((item) => ({ value: item.value, label: item.label }))}
                onChange={(value) => updateField('productType', value)}
              />
            </Field>
          )}
        </div>
      )}

      {errorFields.has('offerSentAt') && (
        <Field label="Offer sent date" invalid={touched.has('offerSentAt')}>
          <Input
            type="date"
            value={form.offerSentAt}
            onChange={(event) => updateField('offerSentAt', event.target.value)}
          />
        </Field>
      )}

      {errorFields.has('offerProof') && (
        <Field label="Offer attachment / proof" invalid={touched.has('offerProof')}>
          <div className="space-y-2">
            <Input
              value={form.offerLink}
              onChange={(event) => updateField('offerLink', event.target.value)}
              placeholder="Offer link (https://...)"
            />
            <Input
              value={form.offerFileUrl}
              onChange={(event) => updateField('offerFileUrl', event.target.value)}
              placeholder="Offer file URL"
            />
            <Input
              value={form.offerScreenshotUrl}
              onChange={(event) => updateField('offerScreenshotUrl', event.target.value)}
              placeholder="Messenger screenshot URL"
            />
          </div>
        </Field>
      )}

      {errorFields.has('contractProof') && (
        <Field label="Contract proof" invalid={touched.has('contractProof')}>
          <div className="space-y-2">
            <Input
              type="date"
              value={form.contractSignedAt}
              onChange={(event) => updateField('contractSignedAt', event.target.value)}
            />
            <Input
              value={form.contractFileUrl}
              onChange={(event) => updateField('contractFileUrl', event.target.value)}
              placeholder="Contract file URL"
            />
          </div>
        </Field>
      )}

      {(errorFields.has('source') || errorFields.has('sourceDetail')) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {errorFields.has('source') && (
            <Field label="From" invalid={touched.has('source')}>
              <NativeSelect
                value={form.source}
                placeholder="Select source..."
                options={LEAD_SOURCES.map((source) => ({
                  value: source.value,
                  label: source.label,
                }))}
                onChange={(value) => updateField('source', value)}
              />
            </Field>
          )}
          {errorFields.has('sourceDetail') && (
            <Field label="Where" invalid={touched.has('sourceDetail')}>
              <NativeSelect
                value={form.sourceDetail}
                placeholder="Select channel..."
                options={whereOptions}
                onChange={(value) => updateField('sourceDetail', value)}
              />
            </Field>
          )}
        </div>
      )}

      {form.source === 'PARTNER' && errorFields.has('sourcePartnerId') && (
        <Field invalid={touched.has('sourcePartnerId')}>
          <SearchField
            label="Partner"
            value={form.sourcePartnerId}
            displayValue={deal.sourcePartner?.name ?? undefined}
            placeholder="Select partner"
            onSave={(value) => updateField('sourcePartnerId', value)}
            onSearch={async (query) => {
              const data = await partnersApi.getAll({ pageSize: 20, search: query || undefined });
              return data.items.map((partner) => ({ value: partner.id, label: partner.name }));
            }}
          />
        </Field>
      )}

      {form.source === 'CLIENT' && errorFields.has('sourceContactId') && (
        <Field invalid={touched.has('sourceContactId')}>
          <SearchField
            label="Referral contact"
            value={form.sourceContactId}
            displayValue={
              deal.sourceContact
                ? `${deal.sourceContact.firstName} ${deal.sourceContact.lastName}`
                : undefined
            }
            placeholder="Select contact"
            onSave={(value) => updateField('sourceContactId', value)}
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

      {form.source === 'MARKETING' &&
      Boolean(form.sourceDetail) &&
      (errorFields.has('whichOne') ||
        requiresMarketingWhichOneSelection(form.source, form.sourceDetail)) ? (
        <Field invalid={touched.has('whichOne')}>
          <SearchField
            label="Which one"
            value={form.marketingAccountId || form.marketingActivityId}
            displayValue={deal.marketingAccount?.name ?? deal.marketingActivity?.title ?? undefined}
            placeholder="Search accounts or activities..."
            onSave={(value) => {
              const [type, id] = value.split(':');
              updateField('marketingAccountId', type === 'ACCOUNT' ? (id ?? '') : '');
              updateField('marketingActivityId', type === 'ACTIVITY' ? (id ?? '') : '');
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
      ) : null}

      {errorFields.has('companyId') && (
        <Field invalid={touched.has('companyId')}>
          <SearchField
            label="Company"
            value={form.companyId}
            displayValue={deal.company?.name ?? undefined}
            placeholder="Select company"
            onSave={(value) => updateField('companyId', value)}
            onSearch={async (query) => {
              const data = await companiesApi.getAll({ pageSize: 20, search: query || undefined });
              return data.items.map((company) => ({ value: company.id, label: company.name }));
            }}
          />
        </Field>
      )}

      {(errorFields.has('pmId') || errorFields.has('existingProductId')) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {errorFields.has('pmId') && (
            <Field invalid={touched.has('pmId')}>
              <SearchField
                label="Project manager"
                value={form.pmId}
                displayValue={deal.pm ? `${deal.pm.firstName} ${deal.pm.lastName}` : undefined}
                placeholder="Select PM"
                onSave={(value) => updateField('pmId', value)}
                onSearch={async (query) => {
                  const data = await employeesApi.getAll({
                    pageSize: 20,
                    search: query || undefined,
                  });
                  return data.items.map((employee) => ({
                    value: employee.id,
                    label: `${employee.firstName} ${employee.lastName}`,
                    subtitle: employee.position ?? employee.email,
                  }));
                }}
              />
            </Field>
          )}

          {errorFields.has('existingProductId') && (
            <Field invalid={touched.has('existingProductId')}>
              <SearchField
                label="Existing product"
                value={form.existingProductId}
                displayValue={deal.existingProduct?.name ?? undefined}
                placeholder="Select product"
                onSave={(value) => updateField('existingProductId', value)}
                onSearch={async (query) => {
                  const data = await productsApi.getAll({
                    pageSize: 20,
                    search: query || undefined,
                  });
                  return data.items.map((product) => ({
                    value: product.id,
                    label: product.name,
                    subtitle: `${product.productCategory} · ${product.productType}`,
                  }));
                }}
              />
            </Field>
          )}
        </div>
      )}

      {errorFields.has('deadline') && (
        <Field label="Deadline" invalid={touched.has('deadline')}>
          <Input
            type="date"
            value={form.deadline}
            onChange={(event) => updateField('deadline', event.target.value)}
          />
        </Field>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={saving}
          onClick={() => runSubmit('save')}
        >
          Save
        </Button>
        <Button
          type="button"
          className="w-full"
          disabled={saving}
          onClick={() => runSubmit('move')}
        >
          Save and move
        </Button>
      </div>
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

function getWhereOptions(
  source: string,
  marketingOptions: Array<{ value: string; label: string }>,
): Array<{ value: string; label: string }> {
  if (source === 'SALES') {
    return SALES_CHANNELS.map((channel) => ({ value: channel.value, label: channel.label }));
  }
  if (source === 'MARKETING') {
    return marketingOptions;
  }
  return [];
}

function getInitialForm(deal: Deal): FormState {
  return {
    amount: deal.amount != null ? String(deal.amount) : '',
    paymentType: deal.paymentType ?? '',
    productCategory: deal.productCategory ?? '',
    productType: deal.productType ?? '',
    offerSentAt: toDateInputValue(deal.offerSentAt),
    offerLink: deal.offerLink ?? '',
    offerFileUrl: deal.offerFileUrl ?? '',
    offerScreenshotUrl: deal.offerScreenshotUrl ?? '',
    contractSignedAt: toDateInputValue(deal.contractSignedAt),
    contractFileUrl: deal.contractFileUrl ?? '',
    source: deal.source ?? '',
    sourceDetail: deal.sourceDetail ?? '',
    sourcePartnerId: deal.sourcePartnerId ?? '',
    sourceContactId: deal.sourceContactId ?? '',
    marketingAccountId: deal.marketingAccountId ?? '',
    marketingActivityId: deal.marketingActivityId ?? '',
    companyId: deal.companyId ?? '',
    pmId: deal.pmId ?? '',
    deadline: toDateInputValue(deal.deadline),
    existingProductId: deal.existingProductId ?? '',
  };
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
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

function getMissingFields(form: FormState, errorFields: Set<string>): string[] {
  const missing: string[] = [];
  if (errorFields.has('amount') && !form.amount.trim()) missing.push('amount');
  if (errorFields.has('paymentType') && !form.paymentType) missing.push('paymentType');
  if (errorFields.has('productCategory') && !form.productCategory) missing.push('productCategory');
  if (errorFields.has('productType') && !form.productType) missing.push('productType');
  if (errorFields.has('offerSentAt') && !form.offerSentAt) missing.push('offerSentAt');
  if (errorFields.has('offerProof')) {
    const hasOfferProof =
      Boolean(form.offerLink.trim()) ||
      Boolean(form.offerFileUrl.trim()) ||
      Boolean(form.offerScreenshotUrl.trim());
    if (!hasOfferProof) missing.push('offerProof');
  }
  if (errorFields.has('contractProof')) {
    const hasContractProof = Boolean(form.contractSignedAt) || Boolean(form.contractFileUrl.trim());
    if (!hasContractProof) missing.push('contractProof');
  }
  if (errorFields.has('source') && !form.source) missing.push('source');
  if (errorFields.has('sourceDetail') && !form.sourceDetail) missing.push('sourceDetail');
  if (errorFields.has('sourcePartnerId') && !form.sourcePartnerId) missing.push('sourcePartnerId');
  if (errorFields.has('sourceContactId') && !form.sourceContactId) missing.push('sourceContactId');
  if (errorFields.has('whichOne') && !form.marketingAccountId && !form.marketingActivityId) {
    missing.push('whichOne');
  }
  if (errorFields.has('companyId') && !form.companyId) missing.push('companyId');
  if (errorFields.has('pmId') && !form.pmId) missing.push('pmId');
  if (errorFields.has('deadline') && !form.deadline) missing.push('deadline');
  if (errorFields.has('existingProductId') && !form.existingProductId) {
    missing.push('existingProductId');
  }
  return missing;
}

function buildChangedPayload(deal: Deal, form: FormState): Partial<Deal> {
  const payload: Partial<Deal> = {};
  assignString(payload, 'paymentType', deal.paymentType, form.paymentType);
  assignString(payload, 'productCategory', deal.productCategory, form.productCategory);
  assignString(payload, 'productType', deal.productType, form.productType);
  assignString(payload, 'offerSentAt', deal.offerSentAt, form.offerSentAt);
  assignString(payload, 'offerLink', deal.offerLink, form.offerLink);
  assignString(payload, 'offerFileUrl', deal.offerFileUrl, form.offerFileUrl);
  assignString(payload, 'offerScreenshotUrl', deal.offerScreenshotUrl, form.offerScreenshotUrl);
  assignString(payload, 'contractSignedAt', deal.contractSignedAt, form.contractSignedAt);
  assignString(payload, 'contractFileUrl', deal.contractFileUrl, form.contractFileUrl);
  assignString(payload, 'source', deal.source, form.source);
  assignString(payload, 'sourceDetail', deal.sourceDetail, form.sourceDetail);
  assignString(payload, 'sourcePartnerId', deal.sourcePartnerId, form.sourcePartnerId);
  assignString(payload, 'sourceContactId', deal.sourceContactId, form.sourceContactId);
  assignString(payload, 'marketingAccountId', deal.marketingAccountId, form.marketingAccountId);
  assignString(payload, 'marketingActivityId', deal.marketingActivityId, form.marketingActivityId);
  assignString(payload, 'companyId', deal.companyId ?? null, form.companyId);
  assignString(payload, 'pmId', deal.pmId, form.pmId);
  assignString(payload, 'deadline', deal.deadline, form.deadline);
  assignString(payload, 'existingProductId', deal.existingProductId, form.existingProductId);

  const normalizedAmount = form.amount.trim();
  const nextAmount = normalizedAmount ? Number(normalizedAmount) : null;
  if ((deal.amount ?? null) !== nextAmount) {
    payload.amount = nextAmount;
  }
  return payload;
}

function assignString<TKey extends keyof Partial<Deal>>(
  payload: Partial<Deal>,
  field: TKey,
  current: string | null | undefined,
  next: string,
) {
  const normalized = next.trim() || null;
  const currentNormalized = current?.trim() || null;
  if (currentNormalized !== normalized) {
    payload[field] = normalized as Partial<Deal>[TKey];
  }
}
