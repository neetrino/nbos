import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import ruDashboard from '../messages/ru/dashboard.json';

const PLURAL_MESSAGE = '{count, plural, one {# item} few {# items} many {# items} other {# items}}';
const RU_PLURAL_MESSAGE =
  '{count, plural, one {# элемент} few {# элемента} many {# элементов} other {# элемента}}';

describe('ICU Russian plurals', () => {
  it('selects 0/1/2/5/11/21 forms', () => {
    const t = createTranslator({
      locale: 'ru',
      messages: { sample: RU_PLURAL_MESSAGE },
    });
    expect(t('sample', { count: 0 })).toBe('0 элементов');
    expect(t('sample', { count: 1 })).toBe('1 элемент');
    expect(t('sample', { count: 2 })).toBe('2 элемента');
    expect(t('sample', { count: 5 })).toBe('5 элементов');
    expect(t('sample', { count: 11 })).toBe('11 элементов');
    expect(t('sample', { count: 21 })).toBe('21 элемент');
  });

  it('interpolates names without translating them', () => {
    const t = createTranslator({
      locale: 'en',
      messages: { hello: 'Hello, {name}' },
    });
    expect(t('hello', { name: 'Արամ' })).toBe('Hello, Արամ');
    expect(PLURAL_MESSAGE).toContain('{count, plural');
  });

  it('formats dashboard priority cards for Russian 0/1/2/5/11/21', () => {
    const t = createTranslator({
      locale: 'ru',
      messages: { dashboard: ruDashboard },
    });
    const samples = [
      [0, '0 задач на сегодня'],
      [1, '1 задача на сегодня'],
      [2, '2 задачи на сегодня'],
      [5, '5 задач на сегодня'],
      [11, '11 задач на сегодня'],
      [21, '21 задача на сегодня'],
    ] as const;

    for (const [count, expected] of samples) {
      expect(t('dashboard.priorityFeed.cards.taskDueToday.title', { count })).toBe(expected);
    }
  });
});
