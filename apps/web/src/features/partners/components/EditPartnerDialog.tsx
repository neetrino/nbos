'use client';

import { useState, type FormEvent } from 'react';
import { CreateFormDialog } from '@/components/shared';
import {
  parsePartnerDefaultPercentInput,
  formatPartnerDefaultPercentForForm,
} from '@/features/partners/utils/partner-default-percent';
import { sliceIsoToDateInput } from '@/features/partners/utils/partner-detail-format';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { getApiErrorMessage } from '@/lib/api-errors';
import { CreatePartnerDialogFields } from './CreatePartnerDialogFields';
import { type CreatePartnerFormState } from './create-partner-form-state';

interface EditPartnerDialogProps {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Partner) => void;
  forceNestedBackdrop?: boolean;
}

function partnerToForm(partner: Partner): CreatePartnerFormState {
  return {
    name: partner.name,
    level: partner.level,
    direction: partner.direction,
    defaultPercent: formatPartnerDefaultPercentForForm(partner.defaultPercent),
    status: partner.status,
    contactId: partner.contactId ?? 'none',
    notes: partner.notes ?? '',
    startDate: sliceIsoToDateInput(partner.startDate),
  };
}

export function EditPartnerDialog(props: EditPartnerDialogProps) {
  const sessionKey = props.open && props.partner ? props.partner.id : 'closed';
  return <EditPartnerDialogSession key={sessionKey} {...props} />;
}

function EditPartnerDialogSession({
  partner,
  open,
  onOpenChange,
  onSaved,
  forceNestedBackdrop = false,
}: EditPartnerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [contactLabel, setContactLabel] = useState<string | null>(
    partner?.contact ? `${partner.contact.firstName} ${partner.contact.lastName}`.trim() : null,
  );
  const [form, setForm] = useState<CreatePartnerFormState>(() =>
    partner
      ? partnerToForm(partner)
      : {
          name: '',
          level: 'REGULAR',
          direction: 'INBOUND',
          defaultPercent: '',
          status: 'ACTIVE',
          contactId: 'none',
          notes: '',
          startDate: '',
        },
  );
  const pct = parsePartnerDefaultPercentInput(form.defaultPercent);
  const canSubmit = Boolean(partner && form.name.trim()) && pct !== null;

  if (!partner) return null;

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Partner"
      error={formError}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel="Save"
      submittingLabel="Saving…"
      cancelLabel="Cancel"
      forceNestedBackdrop={forceNestedBackdrop}
      onSubmit={(event) =>
        void submitPartnerEdit({
          event,
          partner,
          canSubmit,
          pct,
          form,
          setLoading,
          setFormError,
          onSaved,
          onOpenChange,
        })
      }
    >
      <CreatePartnerDialogFields
        form={form}
        contactLabel={contactLabel}
        percentInvalid={form.defaultPercent.trim() !== '' && pct === null}
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

async function submitPartnerEdit(options: {
  event: FormEvent;
  partner: Partner;
  canSubmit: boolean;
  pct: number | null;
  form: CreatePartnerFormState;
  setLoading: (loading: boolean) => void;
  setFormError: (error: string | null) => void;
  onSaved: (updated: Partner) => void;
  onOpenChange: (open: boolean) => void;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit || options.pct === null) return;
  options.setLoading(true);
  options.setFormError(null);
  try {
    const updated = await partnersApi.update(options.partner.id, {
      name: options.form.name.trim(),
      level: options.form.level,
      direction: options.form.direction,
      defaultPercent: options.pct,
      status: options.form.status,
      contactId: options.form.contactId === 'none' ? null : options.form.contactId,
      notes: options.form.notes.trim() || null,
      startDate: options.form.startDate.trim() || null,
    });
    options.onSaved(updated);
    options.onOpenChange(false);
  } catch (caught) {
    options.setFormError(
      getApiErrorMessage(
        caught,
        'Partner could not be saved. Check your connection and try again.',
      ),
    );
  } finally {
    options.setLoading(false);
  }
}
