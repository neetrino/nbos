import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { flattenMessageKeys } from '@/i18n/flatten-messages';
import en from '@/messages/en/expense-plans.json';
import ru from '@/messages/ru/expense-plans.json';
import {
  EXPENSE_PLAN_CATEGORY_VALUES,
  EXPENSE_PLAN_FREQUENCY_VALUES,
  EXPENSE_PLAN_STATUS_VALUES,
  expensePlanCategoryMessageKey,
  expensePlanCellStatusMessageKey,
  expensePlanFrequencyMessageKey,
  expensePlanStatusMessageKey,
} from './expense-plan-message-keys';

describe('expense-plan message catalogs', () => {
  it('keeps EN/RU keys aligned', () => {
    expect(flattenMessageKeys(ru).sort()).toEqual(flattenMessageKeys(en).sort());
  });

  it('maps status, frequency, category, and cell values to keys', () => {
    expect(expensePlanStatusMessageKey('ACTIVE')).toBe('status.ACTIVE');
    expect(expensePlanStatusMessageKey('UNKNOWN')).toBeNull();
    expect(expensePlanFrequencyMessageKey('MONTHLY')).toBe('frequency.MONTHLY');
    expect(expensePlanFrequencyMessageKey('CUSTOM')).toBe('frequency.OTHER');
    expect(expensePlanCategoryMessageKey('TOOLS')).toBe('category.TOOLS');
    expect(expensePlanCellStatusMessageKey('PAID')).toBe('grid.cell.PAID');
    expect(expensePlanCellStatusMessageKey('NA')).toBeNull();
    expect(EXPENSE_PLAN_STATUS_VALUES).toEqual(['ACTIVE', 'CANCELLED']);
    expect(EXPENSE_PLAN_FREQUENCY_VALUES).toContain('MONTHLY');
    expect(EXPENSE_PLAN_CATEGORY_VALUES).toContain('DOMAIN');
  });

  it('formats Russian linked-card plurals for 0/1/2/5/11/21', () => {
    const translator = createTranslator({
      locale: 'ru',
      messages: { expensePlans: ru },
    });
    const samples = [
      [0, '0 связанных карточек'],
      [1, '1 связанная карточка'],
      [2, '2 связанные карточки'],
      [5, '5 связанных карточек'],
      [11, '11 связанных карточек'],
      [21, '21 связанная карточка'],
    ] as const;
    for (const [count, expected] of samples) {
      expect(translator('expensePlans.card.linkedCards', { count })).toBe(expected);
    }
  });
});
