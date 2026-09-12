'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ENABLED_INTERFACE_LOCALES, INTERFACE_LOCALE_NATIVE_NAMES } from '@/i18n/constants';
import { useInterfaceLocale } from '@/i18n/interface-locale-provider';
import type { WritableInterfaceLocale } from '@nbos/shared';

export function LanguageSwitcher() {
  const t = useTranslations('account');
  const { locale, saving, changeLocale } = useInterfaceLocale();

  const onSelect = async (next: WritableInterfaceLocale) => {
    if (next === locale || saving) return;
    try {
      await changeLocale(next);
    } catch {
      toast.error(t('languageSaveFailed'));
    }
  };

  return (
    <div className="border-border border-t px-3 py-3">
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide">{t('language')}</p>
      <div role="radiogroup" aria-label={t('language')} className="bg-muted flex gap-0.5 rounded-lg p-0.5">
        {ENABLED_INTERFACE_LOCALES.map((value) => {
          const selected = locale === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={INTERFACE_LOCALE_NATIVE_NAMES[value]}
              disabled={saving}
              onClick={() => void onSelect(value)}
              className={cn(
                'flex flex-1 items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                selected
                  ? 'bg-background text-foreground ring-ring shadow-sm ring-1'
                  : 'text-muted-foreground hover:text-foreground',
                saving && 'opacity-70',
              )}
            >
              <span>{INTERFACE_LOCALE_NATIVE_NAMES[value]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
