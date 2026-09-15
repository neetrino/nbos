'use client';

import { useTranslations } from 'next-intl';
import { InlineField } from '@/components/shared';

export function PartnerNotesStartFields(props: {
  notes: string;
  startDate: string;
  onNotesChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
}) {
  const t = useTranslations('forms');

  return (
    <>
      <InlineField
        variant="controlled"
        label={t('partner.fields.notes')}
        type="textarea"
        value={props.notes}
        placeholder={t('partner.placeholders.notes')}
        onValueChange={props.onNotesChange}
      />
      <InlineField
        variant="controlled"
        label={t('partner.fields.partnerSince')}
        type="date"
        value={props.startDate}
        onValueChange={props.onStartDateChange}
      />
    </>
  );
}
