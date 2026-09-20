import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Армянские банки на общем протоколе ArCa. ArCa — не банк, а система, через которую работают все
 * банки страны, кроме InecoBank и Ameriabank со своими шлюзами. Объём работы у них одинаковый,
 * поэтому и units одинаковые; отдельные карточки нужны, чтобы исполнитель знал конкретный банк и
 * его доступы. Новый банк — копия этой карточки с тем же вектором.
 */
export const ARCA_BANK_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'PAY_ACBA',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг ACBA Bank',
    summary: 'Карточная оплата ACBA Bank через шлюз ArCa.',
    scopeBoundaries:
      'Один банк на протоколе ArCa: регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда. Объём работы одинаков для всех банков ArCa, карточки разные, чтобы разработчик знал банк и его доступы.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_ARDSHINBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг Ardshinbank',
    summary: 'Карточная оплата Ardshinbank через шлюз ArCa.',
    scopeBoundaries:
      'Один банк на протоколе ArCa: регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда. Объём работы одинаков для всех банков ArCa, карточки разные, чтобы разработчик знал банк и его доступы.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_ARMECONOMBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг Armeconombank',
    summary: 'Карточная оплата Armeconombank через шлюз ArCa.',
    scopeBoundaries:
      'Один банк на протоколе ArCa: регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда. Объём работы одинаков для всех банков ArCa, карточки разные, чтобы разработчик знал банк и его доступы.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_CONVERSE',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг Converse Bank',
    summary: 'Карточная оплата Converse Bank через шлюз ArCa.',
    scopeBoundaries:
      'Один банк на протоколе ArCa: регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда. Объём работы одинаков для всех банков ArCa, карточки разные, чтобы разработчик знал банк и его доступы.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_EVOCA',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг Evocabank',
    summary: 'Карточная оплата Evocabank через шлюз ArCa.',
    scopeBoundaries:
      'Один банк на протоколе ArCa: регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда. Объём работы одинаков для всех банков ArCa, карточки разные, чтобы разработчик знал банк и его доступы.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_UNIBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг Unibank',
    summary: 'Карточная оплата Unibank через шлюз ArCa.',
    scopeBoundaries:
      'Один банк на протоколе ArCa: регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда. Объём работы одинаков для всех банков ArCa, карточки разные, чтобы разработчик знал банк и его доступы.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_FAST_BANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг Fast Bank',
    summary: 'Карточная оплата Fast Bank через шлюз ArCa.',
    scopeBoundaries:
      'Один банк на протоколе ArCa: регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда. Объём работы одинаков для всех банков ArCa, карточки разные, чтобы разработчик знал банк и его доступы.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_ARMSWISSBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг ArmSwissBank',
    summary: 'Карточная оплата ArmSwissBank через шлюз ArCa.',
    scopeBoundaries:
      'Один банк на протоколе ArCa: регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда. Объём работы одинаков для всех банков ArCa, карточки разные, чтобы разработчик знал банк и его доступы.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_BYBLOS',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг Byblos Bank Armenia',
    summary: 'Карточная оплата Byblos Bank Armenia через шлюз ArCa.',
    scopeBoundaries:
      'Один банк на протоколе ArCa: регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда. Объём работы одинаков для всех банков ArCa, карточки разные, чтобы разработчик знал банк и его доступы.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
] as const;
