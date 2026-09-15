'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { leadsApi, type Lead } from '@/lib/api/leads';
import { toast } from 'sonner';
import { firstReleaseFormErrorCopy, localizeCaughtApiError } from '@/i18n/localize-api-error';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (lead: Lead, options?: { openFull?: boolean }) => Promise<void> | void;
}

const EMPTY_LEAD_FORM = { name: '', phone: '', email: '' };

export function CreateLeadDialog(props: CreateLeadDialogProps) {
  return <CreateLeadDialogSession key={props.open ? 'open' : 'closed'} {...props} />;
}

function CreateLeadDialogSession({ open, onOpenChange, onCreated }: CreateLeadDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_LEAD_FORM);
  const canSubmit = form.name.trim().length > 0;

  const createLead = async (openFull: boolean) => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const lead = await leadsApi.create({
        name: form.name.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      });
      await onCreated(lead, { openFull });
      onOpenChange(false);
    } catch (err) {
      toast.error(
        localizeCaughtApiError(
          err,
          firstReleaseFormErrorCopy(
            tCommon('permissionDenied'),
            t('lead.createError'),
            t('errors.validation'),
            t('lead.createError'),
            t('errors.network'),
          ),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('lead.title')}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={t('lead.createLead')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      secondaryAction={{
        label: t('lead.full'),
        onClick: () => void createLead(true),
        disabled: !canSubmit,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        void createLead(false);
      }}
    >
      <InlineField
        variant="controlled"
        label={t('lead.fields.title')}
        type="text"
        value={form.name}
        onValueChange={(name) => setForm((prev) => ({ ...prev, name }))}
      />
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('lead.fields.phone')}
          type="phone"
          value={form.phone}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
        />
        <InlineField
          variant="controlled"
          label={t('lead.fields.email')}
          type="text"
          value={form.email}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(email) => setForm((prev) => ({ ...prev, email }))}
        />
      </FormFieldRow>
    </CreateFormDialog>
  );
}
