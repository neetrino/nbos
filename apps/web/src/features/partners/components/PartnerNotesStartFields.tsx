'use client';

import { useTranslations } from 'next-intl';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function PartnerNotesStartFields(props: {
  notes: string;
  startDate: string;
  onNotesChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
}) {
  const t = useTranslations('forms');
  const { notes, startDate, onNotesChange, onStartDateChange } = props;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="partner-notes">{t('partner.fields.notes')}</Label>
        <Textarea
          id="partner-notes"
          rows={3}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t('partner.placeholders.notes')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="partner-start-date">{t('partner.fields.partnerSince')}</Label>
        <NbosDatePicker
          id="partner-start-date"
          value={startDate}
          onChange={onStartDateChange}
          aria-label={t('partner.fields.partnerSinceAria')}
        />
      </div>
    </div>
  );
}
