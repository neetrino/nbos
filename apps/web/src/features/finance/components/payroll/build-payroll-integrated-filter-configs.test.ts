import { describe, expect, it } from 'vitest';
import {
  buildPayrollIntegratedFilterConfigs,
  PAYROLL_FILTER_MONTH_FROM_KEY,
  PAYROLL_FILTER_MONTH_TO_KEY,
  PAYROLL_FILTER_STATUS_KEY,
} from './build-payroll-integrated-filter-configs';

const LABELS = {
  'filters.status': 'Статус',
  'filters.monthFrom': 'Месяц с',
  'filters.monthTo': 'Месяц по',
  'filters.allStatus': 'Все статусы',
  'filters.allMonths': 'Все месяцы',
  'status.DRAFT': 'Черновик',
  'status.REVIEW': 'Проверка',
  'status.APPROVED': 'Утверждена',
  'status.PAYING': 'Выплата',
  'status.CLOSED': 'Закрыта',
} as const;

describe('buildPayrollIntegratedFilterConfigs', () => {
  it('keeps filter keys and translates labels at render', () => {
    const configs = buildPayrollIntegratedFilterConfigs((key) => LABELS[key]);

    expect(configs.map((item) => item.key)).toEqual([
      PAYROLL_FILTER_STATUS_KEY,
      PAYROLL_FILTER_MONTH_FROM_KEY,
      PAYROLL_FILTER_MONTH_TO_KEY,
    ]);
    expect(configs[0]?.label).toBe('Статус');
    expect(configs[0]?.allOptionLabel).toBe('Все статусы');
    expect(configs[0]?.options.map((option) => option.value)).toEqual([
      'DRAFT',
      'REVIEW',
      'APPROVED',
      'PAYING',
      'CLOSED',
    ]);
    expect(configs[0]?.options[0]?.label).toBe('Черновик');
  });
});
