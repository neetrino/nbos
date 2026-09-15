'use client';

import { useTranslations } from 'next-intl';

export function CallActivityNote({ note }: { note: string | null }) {
  const t = useTranslations('crm');
  if (!note) return null;
  return (
    <p className="text-muted-foreground mt-2 line-clamp-3 text-xs leading-relaxed">
      <span className="text-foreground font-medium">{t('calls.note')}: </span>
      {note}
    </p>
  );
}
