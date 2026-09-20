import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Оплаты. Каждый провайдер — отдельная карточка: работа не переиспользуется между шлюзами,
 * а клиент почти всегда выбирает конкретный банк или кошелёк.
 */
export const PAYMENTS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'PAY_IDRAM',
    category: 'payments',
    iconKey: 'Wallet',
    title: 'Оплата Idram',
    summary: 'Приём платежей через кошелёк Idram.',
    scopeBoundaries:
      'Инициация платежа, callback подтверждения, повторные события, успешный и неуспешный сценарий, сверка с кабинетом провайдера.',
    units: { BACKEND: 10, FRONTEND: 3, PM: 1, QA: 2, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_TELCELL',
    category: 'payments',
    iconKey: 'Wallet',
    title: 'Оплата Telcell',
    summary: 'Приём платежей через Telcell Wallet.',
    scopeBoundaries:
      'Инициация платежа, callback, идемпотентность повторных уведомлений, тестовые сценарии, сверка.',
    units: { BACKEND: 10, FRONTEND: 3, PM: 1, QA: 2, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_FASTSHIFT',
    category: 'payments',
    iconKey: 'Wallet',
    title: 'Оплата FastShift',
    summary: 'Приём платежей через FastShift.',
    scopeBoundaries: 'Инициация платежа, callback, обработка ошибок, тестовые сценарии, сверка.',
    units: { BACKEND: 10, FRONTEND: 3, PM: 1, QA: 2, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_INECOBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг InecoBank',
    summary: 'Карточная оплата через шлюз InecoBank.',
    scopeBoundaries:
      'Регистрация заказа в шлюзе, 3-D Secure, возвраты по запросу, обработка отказов, тестовая и продакшн-среда.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_IDBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг IdBank',
    summary: 'Карточная оплата через шлюз IdBank.',
    scopeBoundaries:
      'Регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_AMERIABANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг Ameriabank',
    summary: 'Карточная оплата через шлюз Ameriabank.',
    scopeBoundaries:
      'Регистрация заказа, 3-D Secure, возвраты, обработка отказов, тестовая и продакшн-среда.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_ARCA_OTHER_BANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Эквайринг другого банка ARCA',
    summary: 'Подключение ещё одного армянского банковского шлюза.',
    scopeBoundaries:
      'Один дополнительный банк со своим API, 3-D Secure, возвраты, сверка. Каждый следующий банк — отдельная карточка.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_STRIPE',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Оплата Stripe',
    summary: 'Приём международных карт через Stripe.',
    scopeBoundaries:
      'Checkout или Payment Intents, webhooks, возвраты, валюта расчёта, тестовый режим. Подписки Stripe — отдельная карточка.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_PAYPAL',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Оплата PayPal',
    summary: 'Приём платежей через PayPal.',
    scopeBoundaries: 'Checkout, webhooks, возвраты, валюта расчёта, sandbox и продакшн.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'PAY_BANK_TRANSFER',
    category: 'payments',
    iconKey: 'Receipt',
    title: 'Оплата по счёту',
    summary: 'Безналичная оплата с выставлением счёта.',
    scopeBoundaries:
      'Генерация счёта, реквизиты, подтверждение поступления вручную, статусы и уведомления.',
    units: { BACKEND: 8, FRONTEND: 3, PM: 1, QA: 2 },
  },
  {
    code: 'PAY_INSTALLMENTS',
    category: 'payments',
    iconKey: 'Percent',
    title: 'Рассрочка банка',
    summary: 'Оформление покупки в рассрочку через банк-партнёр.',
    scopeBoundaries:
      'Один банк рассрочки, передача корзины, статусы заявки, отказ и подтверждение, ограничения по товарам.',
    units: { BACKEND: 14, FRONTEND: 5, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_SUBSCRIPTION_BILLING',
    category: 'payments',
    iconKey: 'Repeat',
    title: 'Подписочные списания',
    summary: 'Регулярные автоматические списания у клиентов продукта.',
    scopeBoundaries:
      'Тарифы, привязка карты, регулярные списания, неудачные попытки, отмена и возобновление. Разовая разработка, не ежемесячная работа.',
    units: { BACKEND: 26, FRONTEND: 10, PM: 3, DESIGNER: 3, QA: 6, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_SPLIT_PAYOUTS',
    category: 'payments',
    iconKey: 'ArrowLeftRight',
    title: 'Разделение платежей между получателями',
    summary: 'Распределение поступивших денег между несколькими получателями.',
    scopeBoundaries:
      'Правила разделения, расчёт долей, журнал операций, выплаты по согласованному каналу, сверка. Юридическая схема расчётов не входит.',
    units: { BACKEND: 24, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_REFUND_FLOW',
    category: 'payments',
    iconKey: 'RefreshCw',
    title: 'Возвраты и отмены оплат',
    summary: 'Полные и частичные возвраты с журналом операций.',
    scopeBoundaries:
      'Полный и частичный возврат по уже подключённым шлюзам, права на операцию, журнал, уведомление клиента.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3 },
  },
  {
    code: 'PAY_MULTI_CURRENCY',
    category: 'payments',
    iconKey: 'Coins',
    title: 'Мультивалютность',
    summary: 'Цены и расчёты в нескольких валютах.',
    scopeBoundaries:
      'Согласованные валюты, источник курсов, округление, отображение и хранение сумм, расчёт при оплате.',
    units: { BACKEND: 16, FRONTEND: 6, PM: 2, QA: 4 },
  },
] as const;
