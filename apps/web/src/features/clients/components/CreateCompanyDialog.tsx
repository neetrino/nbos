'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreateFormDialog,
  DetailSheetFieldSegmented,
  FormFieldRow,
  InlineField,
} from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { COMPANY_TYPES, TAX_STATUSES } from '../constants/clients';
import { companiesApi, type Company } from '@/lib/api/clients';
import { toastApiError } from '@/lib/permissions';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (company?: Company) => void;
  defaultName?: string;
  forceNestedBackdrop?: boolean;
}

const EMPTY_FORM = {
  name: '',
  type: 'LEGAL',
  taxStatus: 'TAX',
};

export function CreateCompanyDialog(props: CreateCompanyDialogProps) {
  const sessionKey = props.open ? `open:${props.defaultName ?? ''}` : 'closed';
  return <CreateCompanyDialogSession key={sessionKey} {...props} />;
}

function CreateCompanyDialogSession({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
  forceNestedBackdrop = false,
}: CreateCompanyDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    name: defaultName.trim(),
  });

  const companyTypeOptions = useMemo(
    () =>
      COMPANY_TYPES.map((companyType) => ({
        value: companyType.value,
        label: t(`company.types.${companyType.value}` as never),
      })),
    [t],
  );
  const taxStatusOptions = useMemo(
    () =>
      TAX_STATUSES.map((taxStatus) => ({
        value: taxStatus.value,
        label: t(`company.taxStatuses.${taxStatus.value}` as never),
      })),
    [t],
  );

  const canSubmit = Boolean(form.name) && Boolean(form.type) && Boolean(form.taxStatus);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('company.title')}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={forceNestedBackdrop}
      onSubmit={(event) =>
        void submitCompany({
          event,
          canSubmit,
          form,
          setLoading,
          onCreated,
          onOpenChange,
          error: t('company.createError'),
        })
      }
    >
      <InlineField
        variant="controlled"
        label={t('company.fields.name')}
        type="text"
        value={form.name}
        placeholder={t('company.placeholders.name')}
        disabled={loading}
        onValueChange={(name) => setForm((prev) => ({ ...prev, name }))}
      />
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('company.fields.type')}
          type="select"
          value={form.type}
          options={companyTypeOptions}
          disabled={loading}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(type) => {
            if (type) setForm((prev) => ({ ...prev, type }));
          }}
        />
        <DetailSheetFieldSegmented
          label={t('company.fields.taxStatus')}
          value={form.taxStatus}
          options={taxStatusOptions}
          onValueChange={(taxStatus) => setForm((prev) => ({ ...prev, taxStatus }))}
          disabled={loading}
          className={FORM_FIELD_CELL_CLASS}
          ariaLabel={t('company.fields.taxStatusAria')}
        />
      </FormFieldRow>
    </CreateFormDialog>
  );
}

async function submitCompany(options: {
  event: FormEvent;
  canSubmit: boolean;
  form: typeof EMPTY_FORM;
  setLoading: (loading: boolean) => void;
  onCreated?: (company?: Company) => void;
  onOpenChange: (open: boolean) => void;
  error: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit) return;
  options.setLoading(true);
  try {
    const created = await companiesApi.create({
      name: options.form.name,
      type: options.form.type,
      taxStatus: options.form.taxStatus,
    });
    options.onCreated?.(created);
    options.onOpenChange(false);
  } catch (caught: unknown) {
    toastApiError(caught, options.error);
  } finally {
    options.setLoading(false);
  }
}
