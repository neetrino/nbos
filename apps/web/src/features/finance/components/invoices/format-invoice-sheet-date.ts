import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';

/** Formats invoice sheet dates with the interface locale, not a hardcoded en-US calendar. */
export function formatInvoiceSheetDate(iso: string, interfaceLocale: string): string {
  try {
    return new Intl.DateTimeFormat(resolveDatePickerLocale(interfaceLocale), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
