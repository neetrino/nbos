'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog } from '@/components/shared';
import { parsePartnerDefaultPercentInput } from '@/features/partners/utils/partner-default-percent';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { getApiErrorMessage } from '@/lib/api-errors';
import { CreatePartnerDialogFields } from './CreatePartnerDialogFields';
import { emptyPartnerForm, type CreatePartnerFormState } from './create-partner-form-state';

interface CreatePartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (partner?: Partner) => void;
  defaultName?: string;
  forceNestedBackdrop?: boolean;
}

export function CreatePartnerDialog(props: CreatePartnerDialogProps) {
  const sessionKey = props.open ? `open:${props.defaultName ?? ''}` : 'closed';
  return <CreatePartnerDialogSession key={sessionKey} {...props} />;
}

function CreatePartnerDialogSession({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
  forceNestedBackdrop = false,
}: CreatePartnerDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [contactLabel, setContactLabel] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyPartnerForm(defaultName));
  const pctPreview = parsePartnerDefaultPercentInput(form.defaultPercent);
  const canSubmit = Boolean(form.name.trim()) && pctPreview !== null;

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('partner.title')}
      error={formError}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={forceNestedBackdrop}
      onSubmit={(event) =>
        void submitPartner({
          event,
          canSubmit,
          form,
          setLoading,
          setFormError,
          onCreated,
          onOpenChange,
          fallbackError: t('partner.createError'),
        })
      }
    >
      <CreatePartnerDialogFields
        form={form}
        contactLabel={contactLabel}
        percentInvalid={form.defaultPercent.trim() !== '' && pctPreview === null}
        onFormChange={(partial) => setForm((prev) => ({ ...prev, ...partial }))}
        onContactSelect={(id, label) => {
          setForm((prev) => ({ ...prev, contactId: id }));
          setContactLabel(label);
        }}
        onContactClear={() => {
          setForm((prev) => ({ ...prev, contactId: 'none' }));
          setContactLabel(null);
        }}
      />
    </CreateFormDialog>
  );
}

async function submitPartner(options: {
  event: FormEvent;
  canSubmit: boolean;
  form: CreatePartnerFormState;
  setLoading: (loading: boolean) => void;
  setFormError: (error: string | null) => void;
  onCreated?: (partner?: Partner) => void;
  onOpenChange: (open: boolean) => void;
  fallbackError: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit) return;
  const pct = parsePartnerDefaultPercentInput(options.form.defaultPercent);
  if (pct === null) return;
  options.setLoading(true);
  options.setFormError(null);
  try {
    const created = await partnersApi.create({
      name: options.form.name.trim(),
      level: options.form.level,
      direction: options.form.direction,
      defaultPercent: pct,
      status: options.form.status,
      ...(options.form.contactId !== 'none' ? { contactId: options.form.contactId } : {}),
      ...(options.form.notes.trim() ? { notes: options.form.notes.trim() } : {}),
      ...(options.form.startDate.trim() ? { startDate: options.form.startDate.trim() } : {}),
    });
    options.onCreated?.(created);
    options.onOpenChange(false);
  } catch (caught) {
    options.setFormError(getApiErrorMessage(caught, options.fallbackError));
  } finally {
    options.setLoading(false);
  }
}
