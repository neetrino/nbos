import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import enExpenses from '@/messages/en/expenses.json';
import ruExpenses from '@/messages/ru/expenses.json';
import { flattenMessageKeys } from '@/i18n/flatten-messages';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STAGES,
  EXPENSE_SYSTEM_CATEGORIES,
} from '@/features/finance/constants/finance';
import {
  EXPENSE_BACKLOG_REASONS,
  EXPENSE_FREQUENCIES,
  EXPENSE_TYPES,
  TAX_STATUSES,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import {
  translateExpenseBacklogReason,
  translateExpenseCategory,
  translateExpenseFrequency,
  translateExpensePaymentStatus,
  translateExpenseStage,
  translateExpenseStageShort,
  translateExpenseTaxStatus,
  translateExpenseType,
  type ExpensesTranslator,
} from './expense-i18n-labels';

function expensesTranslator(locale: 'en' | 'ru'): ExpensesTranslator {
  const messages = locale === 'ru' ? ruExpenses : enExpenses;
  return createTranslator({ locale, messages }) as ExpensesTranslator;
}

describe('expenses catalogs', () => {
  it('keeps EN/RU keys aligned', () => {
    expect(flattenMessageKeys(enExpenses).sort()).toEqual(flattenMessageKeys(ruExpenses).sort());
  });

  it('covers every EXPENSE_* value used at render', () => {
    const t = expensesTranslator('en');
    for (const stage of EXPENSE_STAGES) {
      expect(t(`stage.${stage.value}`)).toBe(stage.label);
      expect(translateExpenseStage(stage.value, t)).toBe(stage.label);
    }
    for (const category of [...EXPENSE_CATEGORIES, ...EXPENSE_SYSTEM_CATEGORIES]) {
      expect(translateExpenseCategory(category.value, t)).toBe(category.label);
    }
    for (const type of EXPENSE_TYPES) {
      expect(translateExpenseType(type.value, t)).toBe(type.label);
    }
    for (const frequency of EXPENSE_FREQUENCIES) {
      expect(translateExpenseFrequency(frequency.value, t)).toBe(frequency.label);
    }
    for (const tax of TAX_STATUSES) {
      expect(translateExpenseTaxStatus(tax.value, t)).toBe(tax.label);
    }
    for (const reason of EXPENSE_BACKLOG_REASONS) {
      expect(translateExpenseBacklogReason(reason.value, t)).toBe(reason.label);
    }
  });

  it('translates RU stage and category labels without changing VALUES', () => {
    const t = expensesTranslator('ru');
    expect(translateExpenseStage('PAID', t)).toBe('Оплачен');
    expect(translateExpenseStageShort('CANCELLED', t)).toBe('Отмена');
    expect(translateExpenseCategory('DOMAIN', t)).toBe('Домен и хостинг');
    expect(translateExpenseCategory('HOSTING', t)).toBe('Домен и хостинг');
    expect(translateExpensePaymentStatus('PARTIAL', t)).toBe('Частично оплачен');
  });

  it('interpolates a payment amount without translating it', () => {
    const t = createTranslator({ locale: 'ru', messages: ruExpenses });
    expect(t('payments.removeAria', { amount: '12 000 AMD' })).toBe(
      'Удалить платёж 12 000 AMD',
    );
  });

  it('leaves unknown category VALUES unchanged', () => {
    const t = expensesTranslator('en');
    expect(translateExpenseCategory('CUSTOM_BUCKET', t)).toBe('CUSTOM_BUCKET');
  });
});
