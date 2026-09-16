'use client';

import { CalendarDays } from 'lucide-react';
import { DetailSheetFieldSegmented, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import {
  CLIENT_SERVICE_BILLING_MODEL_SEGMENTED_OPTIONS,
  CLIENT_SERVICE_FREQUENCIES,
  CLIENT_SERVICE_TYPES,
} from '@/features/finance/constants/client-services';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import {
  CLIENT_SERVICE_BILLING_SHORT_MESSAGE_KEYS,
  CLIENT_SERVICE_FREQUENCY_MESSAGE_KEYS,
  CLIENT_SERVICE_TYPE_MESSAGE_KEYS,
  localizeOptionLabels,
  useClientServicesT,
} from './client-service-message-keys';
import { ClientServiceCredentialField } from './ClientServiceCredentialField';
import { ClientServiceProductField } from './ClientServiceProductField';
import { ClientServiceProviderField } from './ClientServiceProviderField';

interface ClientServiceCreateDialogFieldsProps {
  form: ClientServiceFormState;
  productLabel: string | null;
  projectLabel: string | null;
  credentialLabel: string | null;
  productResolving: boolean;
  onProductSelect: (productId: string, label: string) => void;
  onCredentialSelect: (credentialId: string, label: string) => void;
  onCredentialClear: () => void;
  onFormChange: (partial: Partial<ClientServiceFormState>) => void;
}

export function ClientServiceCreateDialogFields({
  form,
  productLabel,
  projectLabel,
  credentialLabel,
  productResolving,
  onProductSelect,
  onCredentialSelect,
  onCredentialClear,
  onFormChange,
}: ClientServiceCreateDialogFieldsProps) {
  const t = useClientServicesT();
  const namePlaceholderKey = `create.namePlaceholder.${form.type}`;
  const namePlaceholder =
    form.type in CLIENT_SERVICE_TYPE_MESSAGE_KEYS
      ? t(namePlaceholderKey as never)
      : t('create.namePlaceholder.default');

  return (
    <>
      <ClientServiceProductField
        productId={form.productId}
        productLabel={productLabel}
        projectLabel={projectLabel}
        resolving={productResolving}
        required
        onSelect={onProductSelect}
      />
      <InlineField
        variant="controlled"
        label={t('create.name')}
        type="text"
        value={form.name}
        placeholder={namePlaceholder}
        onValueChange={(name) => onFormChange({ name })}
      />
      <TypeAndFrequencyRow form={form} onFormChange={onFormChange} />
      <DetailSheetFieldSegmented
        label={t('create.billing')}
        value={form.billingModel}
        options={localizeOptionLabels(
          CLIENT_SERVICE_BILLING_MODEL_SEGMENTED_OPTIONS,
          t,
          CLIENT_SERVICE_BILLING_SHORT_MESSAGE_KEYS,
        )}
        onValueChange={(billingModel) => onFormChange({ billingModel })}
      />
      <CostAndRenewalRows
        form={form}
        credentialLabel={credentialLabel}
        onFormChange={onFormChange}
        onCredentialSelect={onCredentialSelect}
        onCredentialClear={onCredentialClear}
      />
    </>
  );
}

function TypeAndFrequencyRow({
  form,
  onFormChange,
}: {
  form: ClientServiceFormState;
  onFormChange: (partial: Partial<ClientServiceFormState>) => void;
}) {
  const t = useClientServicesT();
  return (
    <FormFieldRow>
      <InlineField
        variant="controlled"
        label={t('create.type')}
        type="select"
        value={form.type}
        options={localizeOptionLabels(CLIENT_SERVICE_TYPES, t, CLIENT_SERVICE_TYPE_MESSAGE_KEYS)}
        className={FORM_FIELD_CELL_CLASS}
        onValueChange={(type) => type && onFormChange({ type })}
      />
      <InlineField
        variant="controlled"
        label={t('create.frequency')}
        type="select"
        value={form.frequency}
        options={localizeOptionLabels(
          CLIENT_SERVICE_FREQUENCIES,
          t,
          CLIENT_SERVICE_FREQUENCY_MESSAGE_KEYS,
        )}
        icon={<CalendarDays size={12} />}
        className={FORM_FIELD_CELL_CLASS}
        onValueChange={(frequency) => frequency && onFormChange({ frequency })}
      />
    </FormFieldRow>
  );
}

function CostAndRenewalRows({
  form,
  credentialLabel,
  onFormChange,
  onCredentialSelect,
  onCredentialClear,
}: {
  form: ClientServiceFormState;
  credentialLabel: string | null;
  onFormChange: (partial: Partial<ClientServiceFormState>) => void;
  onCredentialSelect: (credentialId: string, label: string) => void;
  onCredentialClear: () => void;
}) {
  const t = useClientServicesT();
  return (
    <>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('create.ourCost')}
          type="money"
          value={form.ourCost}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(ourCost) => onFormChange({ ourCost })}
        />
        <InlineField
          variant="controlled"
          label={t('create.clientCharge')}
          type="money"
          value={form.clientCharge}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(clientCharge) => onFormChange({ clientCharge })}
        />
      </FormFieldRow>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('create.renewalDue')}
          type="date"
          value={form.renewalDate}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(renewalDate) => onFormChange({ renewalDate })}
        />
        <div className={FORM_FIELD_CELL_CLASS}>
          <ClientServiceProviderField
            providerName={form.provider}
            onProviderChange={(provider) => onFormChange({ provider })}
          />
        </div>
      </FormFieldRow>
      <ClientServiceCredentialField
        credentialId={form.providerAccountId}
        credentialLabel={credentialLabel}
        projectId={form.projectId}
        onSelect={onCredentialSelect}
        onClear={onCredentialClear}
      />
    </>
  );
}
