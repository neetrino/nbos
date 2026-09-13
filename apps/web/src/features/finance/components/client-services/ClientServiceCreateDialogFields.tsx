'use client';

import { CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DetailSheetFieldSegmented } from '@/components/shared';
import {
  CLIENT_SERVICE_BILLING_MODEL_SEGMENTED_OPTIONS,
  CLIENT_SERVICE_FREQUENCY_SEGMENTED_OPTIONS,
  CLIENT_SERVICE_TYPES,
} from '@/features/finance/constants/client-services';
import {
  CLIENT_SERVICE_BILLING_SHORT_MESSAGE_KEYS,
  CLIENT_SERVICE_FREQUENCY_SHORT_MESSAGE_KEYS,
  CLIENT_SERVICE_TYPE_MESSAGE_KEYS,
  localizeOptionLabels,
  useClientServicesT,
} from './client-service-message-keys';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import {
  ClientServiceDateInput,
  ClientServiceMoneyInput,
  ClientServiceSelectField,
} from './client-service-form-controls';
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
    <div className="flex flex-col gap-4">
      <ClientServiceProductField
        productId={form.productId}
        productLabel={productLabel}
        projectLabel={projectLabel}
        resolving={productResolving}
        required
        onSelect={onProductSelect}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="client-service-name">{t('create.name')}</Label>
        <Input
          id="client-service-name"
          value={form.name}
          placeholder={namePlaceholder}
          autoComplete="off"
          onChange={(event) => onFormChange({ name: event.target.value })}
        />
      </div>

      <ClientServiceSelectField
        label={t('create.type')}
        value={form.type}
        options={localizeOptionLabels(CLIENT_SERVICE_TYPES, t, CLIENT_SERVICE_TYPE_MESSAGE_KEYS)}
        onChange={(type) => type && onFormChange({ type })}
      />

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

      <DetailSheetFieldSegmented
        label={t('create.frequency')}
        icon={<CalendarDays size={12} />}
        value={form.frequency}
        options={localizeOptionLabels(
          CLIENT_SERVICE_FREQUENCY_SEGMENTED_OPTIONS,
          t,
          CLIENT_SERVICE_FREQUENCY_SHORT_MESSAGE_KEYS,
        )}
        onValueChange={(frequency) => onFormChange({ frequency })}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ClientServiceMoneyInput
          label={t('create.ourCost')}
          value={form.ourCost}
          onChange={(ourCost) => onFormChange({ ourCost })}
        />
        <ClientServiceMoneyInput
          label={t('create.clientCharge')}
          value={form.clientCharge}
          onChange={(clientCharge) => onFormChange({ clientCharge })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ClientServiceDateInput
          label={t('create.renewalDue')}
          value={form.renewalDate}
          onChange={(renewalDate) => onFormChange({ renewalDate })}
        />
        <ClientServiceProviderField
          providerName={form.provider}
          onProviderChange={(provider) => onFormChange({ provider })}
        />
      </div>

      <ClientServiceCredentialField
        credentialId={form.providerAccountId}
        credentialLabel={credentialLabel}
        onSelect={onCredentialSelect}
        onClear={onCredentialClear}
      />
    </div>
  );
}
