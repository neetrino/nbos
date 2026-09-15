'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { RelationCreatePrefill } from '@/components/shared/relation-picker';
import {
  CreateFormDialog,
  DetailSheetFieldSegmented,
  FormFieldRow,
  InlineField,
} from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { CONTACT_ROLES } from '../constants/clients';
import { contactsApi, type Contact } from '@/lib/api/clients';
import { toastApiError } from '@/lib/permissions';

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (contact?: Contact) => void;
  prefill?: RelationCreatePrefill | null;
  forceNestedBackdrop?: boolean;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  role: 'CLIENT',
};

export function CreateContactDialog(props: CreateContactDialogProps) {
  const sessionKey = props.open
    ? `open:${props.prefill?.firstName ?? ''}:${props.prefill?.lastName ?? ''}`
    : 'closed';
  return <CreateContactDialogSession key={sessionKey} {...props} />;
}

function CreateContactDialogSession({
  open,
  onOpenChange,
  onCreated,
  forceNestedBackdrop = false,
  prefill = null,
}: CreateContactDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    firstName: prefill?.firstName ?? '',
    lastName: prefill?.lastName ?? '',
  });

  const contactRoleOptions = useMemo(
    () =>
      CONTACT_ROLES.map((role) => ({
        value: role.value,
        label: t(`contact.roles.${role.value}` as never),
      })),
    [t],
  );

  const canSubmit = Boolean(form.firstName && form.lastName && form.phone && form.role);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('contact.title')}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={forceNestedBackdrop}
      onSubmit={(event) =>
        void submitContact({
          event,
          canSubmit,
          form,
          setLoading,
          onCreated,
          onOpenChange,
          error: t('contact.createError'),
        })
      }
    >
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('contact.fields.firstName')}
          type="text"
          value={form.firstName}
          placeholder={t('contact.placeholders.firstName')}
          disabled={loading}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(firstName) => setForm((prev) => ({ ...prev, firstName }))}
        />
        <InlineField
          variant="controlled"
          label={t('contact.fields.lastName')}
          type="text"
          value={form.lastName}
          placeholder={t('contact.placeholders.lastName')}
          disabled={loading}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(lastName) => setForm((prev) => ({ ...prev, lastName }))}
        />
      </FormFieldRow>
      <InlineField
        variant="controlled"
        label={t('contact.fields.phone')}
        type="phone"
        value={form.phone}
        placeholder={t('contact.placeholders.phone')}
        disabled={loading}
        onValueChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
      />
      <DetailSheetFieldSegmented
        label={t('contact.fields.contactType')}
        value={form.role}
        options={contactRoleOptions}
        onValueChange={(role) => setForm((prev) => ({ ...prev, role }))}
        disabled={loading}
        ariaLabel={t('contact.fields.contactTypeAria')}
      />
    </CreateFormDialog>
  );
}

async function submitContact(options: {
  event: FormEvent;
  canSubmit: boolean;
  form: typeof EMPTY_FORM;
  setLoading: (loading: boolean) => void;
  onCreated?: (contact?: Contact) => void;
  onOpenChange: (open: boolean) => void;
  error: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit) return;
  options.setLoading(true);
  try {
    const created = await contactsApi.create({
      firstName: options.form.firstName,
      lastName: options.form.lastName,
      phone: options.form.phone,
      role: options.form.role,
    });
    options.onCreated?.(created);
    options.onOpenChange(false);
  } catch (caught: unknown) {
    toastApiError(caught, options.error);
  } finally {
    options.setLoading(false);
  }
}
