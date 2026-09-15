'use client';

import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FormFieldRow, InlineField, RelationPickerField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import {
  useContactRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import {
  PARTNER_DEFAULT_PERCENT_MAX,
  PARTNER_DEFAULT_PERCENT_MIN,
  PARTNER_DIRECTIONS,
  PARTNER_LEVELS,
  PARTNER_STATUSES,
} from '@/features/partners/constants/partners';
import { PartnerNotesStartFields } from '@/features/partners/components/PartnerNotesStartFields';
import type { CreatePartnerFormState } from './create-partner-form-state';

interface CreatePartnerDialogFieldsProps {
  form: CreatePartnerFormState;
  contactLabel: string | null;
  percentInvalid: boolean;
  onFormChange: (partial: Partial<CreatePartnerFormState>) => void;
  onContactSelect: (id: string, label: string) => void;
  onContactClear: () => void;
}

export function CreatePartnerDialogFields({
  form,
  contactLabel,
  percentInvalid,
  onFormChange,
  onContactSelect,
  onContactClear,
}: CreatePartnerDialogFieldsProps) {
  const t = useTranslations('forms');
  const searchContacts = useContactRelationSearch();
  const contactPicker = useRelationPickerActions('contact');
  const contactValue = form.contactId === 'none' ? null : form.contactId;
  const levelOptions = PARTNER_LEVELS.map((level) => ({
    value: level.value,
    label: t(`partner.levels.${level.value}` as never),
  }));
  const directionOptions = PARTNER_DIRECTIONS.map((direction) => ({
    value: direction.value,
    label: t(`partner.directions.${direction.value}` as never),
  }));
  const statusOptions = PARTNER_STATUSES.map((status) => ({
    value: status.value,
    label: t(`partner.statuses.${status.value}` as never),
  }));

  return (
    <>
      <InlineField
        variant="controlled"
        label={t('partner.fields.name')}
        type="text"
        value={form.name}
        placeholder={t('partner.placeholders.name')}
        onValueChange={(name) => onFormChange({ name })}
      />
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('partner.fields.level')}
          type="select"
          value={form.level}
          options={levelOptions}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(level) => level && onFormChange({ level })}
        />
        <InlineField
          variant="controlled"
          label={t('partner.fields.direction')}
          type="select"
          value={form.direction}
          options={directionOptions}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(direction) => direction && onFormChange({ direction })}
        />
      </FormFieldRow>
      <FormFieldRow>
        <div className={FORM_FIELD_CELL_CLASS}>
          <InlineField
            variant="controlled"
            label={t('partner.fields.defaultPercent')}
            type="text"
            value={form.defaultPercent}
            onValueChange={(defaultPercent) => onFormChange({ defaultPercent })}
          />
          <p
            className="text-muted-foreground mt-1 text-xs"
            data-invalid={percentInvalid || undefined}
          >
            {PARTNER_DEFAULT_PERCENT_MIN}–{PARTNER_DEFAULT_PERCENT_MAX}
          </p>
        </div>
        <InlineField
          variant="controlled"
          label={t('partner.fields.status')}
          type="select"
          value={form.status}
          options={statusOptions}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(status) => status && onFormChange({ status })}
        />
      </FormFieldRow>
      <PartnerNotesStartFields
        notes={form.notes}
        startDate={form.startDate}
        onNotesChange={(notes) => onFormChange({ notes })}
        onStartDateChange={(startDate) => onFormChange({ startDate })}
      />
      <RelationPickerField
        label={t('partner.fields.primaryContact')}
        entityKind="contact"
        value={contactValue}
        selectionLabel={contactLabel}
        placeholder={t('partner.placeholders.contactSearch')}
        icon={<User size={12} />}
        onSearch={searchContacts}
        onSelect={onContactSelect}
        onClear={onContactClear}
        {...contactPicker}
      />
    </>
  );
}
