import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  FINANCE_PERIOD_OPTIONS,
  INVOICE_MONEY_STAGES,
  INVOICE_TYPES,
} from '@/features/finance/constants/finance';
import {
  FINANCE_DEFAULT_LIST_PERIOD,
  FINANCE_PERIOD_FILTER_KEY,
} from '@/features/finance/constants/finance-period-filter';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';
import {
  INVOICE_STAGE_MESSAGE_KEYS,
  INVOICE_TYPE_MESSAGE_KEYS,
} from './invoice-message-keys';

type InvoicePageTranslator = (key: string) => string;

export function buildInvoicePageFilterConfigs(t: InvoicePageTranslator): FilterConfig[] {
  return [
    {
      key: FINANCE_PERIOD_FILTER_KEY,
      label: t('filters.period'),
      includeAllOption: false,
      defaultOptionValue: FINANCE_DEFAULT_LIST_PERIOD,
      options: FINANCE_PERIOD_OPTIONS.map((option) => ({
        value: option.value,
        label: t(`filters.periodOptions.${option.value}`),
      })),
    },
    {
      key: 'boardScope',
      label: t('filters.status'),
      includeAllOption: false,
      defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
      options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(`boardScope.${option.value}`),
      })),
    },
    {
      key: 'moneyStatus',
      label: t('filters.moneyStatus'),
      options: INVOICE_MONEY_STAGES.map((stage) => ({
        value: stage.value,
        label: t(INVOICE_STAGE_MESSAGE_KEYS[stage.value]),
      })),
    },
    {
      key: 'type',
      label: t('filters.type'),
      options: INVOICE_TYPES.map((type) => ({
        value: type.value,
        label: t(INVOICE_TYPE_MESSAGE_KEYS[type.value]),
      })),
    },
  ];
}
