import {
  translateProductTypeDescription,
  translateProductTypeLabel,
  type CrmTranslate,
} from '../../i18n/crm-copy';
import type { CodeProductTypeOption } from './code-product-type-picker.types';

export function toCodeProductTypeOptions(
  t: CrmTranslate,
  options: readonly { value: string; label: string }[],
): CodeProductTypeOption[] {
  return options.map((option) => ({
    value: option.value,
    label: translateProductTypeLabel(t, option.value),
    description: translateProductTypeDescription(t, option.value),
  }));
}
