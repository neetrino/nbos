import type { CatalogSeedItem } from './catalog-seed-types';

/** Лояльность. Программы, где деньги клиента и его поведение превращаются в скидку или баллы. */
export const LOYALTY_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'LOY_BONUS_POINTS',
    category: 'loyalty',
    iconKey: 'Star',
    title: 'Бонусные баллы',
    summary: 'Начисление и списание баллов за покупки.',
    scopeBoundaries:
      'Правила начисления, списание при оплате, срок жизни баллов, история операций, ограничения на товары.',
    units: { BACKEND: 22, FRONTEND: 10, PM: 3, DESIGNER: 2, QA: 5 },
  },
  {
    code: 'LOY_DISCOUNT_COUPONS',
    category: 'loyalty',
    iconKey: 'Ticket',
    title: 'Промокоды и купоны',
    summary: 'Скидочные коды с условиями и лимитами.',
    scopeBoundaries:
      'Генерация кодов, условия и лимиты применения, срок действия, сочетание с другими скидками, отчёт использования.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 4 },
  },
  {
    code: 'LOY_CUSTOMER_WALLET',
    category: 'loyalty',
    iconKey: 'Wallet',
    title: 'Кошелёк клиента',
    summary: 'Внутренний баланс клиента с историей операций.',
    scopeBoundaries:
      'Пополнение и списание, история, оплата с баланса, возвраты на баланс, сверка. Вывод денег наружу не входит.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 4, QA: 6 },
  },
  {
    code: 'LOY_REFERRAL_PROGRAM',
    category: 'loyalty',
    iconKey: 'Network',
    title: 'Реферальная программа',
    summary: 'Приглашение друзей с вознаграждением.',
    scopeBoundaries:
      'Персональные ссылки и коды, условия вознаграждения, защита от накрутки, статистика у пригласившего.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, DESIGNER: 2, QA: 5 },
  },
  {
    code: 'LOY_TIERS',
    category: 'loyalty',
    iconKey: 'TrendingUp',
    title: 'Уровни лояльности',
    summary: 'Статусы клиентов с разными условиями.',
    scopeBoundaries:
      'Правила перехода между уровнями, привилегии уровня, пересчёт при возвратах, отображение статуса клиенту.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 3, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'LOY_GIFT_CARDS',
    category: 'loyalty',
    iconKey: 'Gift',
    title: 'Подарочные сертификаты',
    summary: 'Продажа и списание сертификатов.',
    scopeBoundaries:
      'Выпуск и номиналы, код сертификата, частичное списание, срок действия, проверка подлинности.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 2, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'LOY_LOYALTY_CARD',
    category: 'loyalty',
    iconKey: 'QrCode',
    title: 'Карта лояльности с кодом',
    summary: 'Электронная карта клиента со сканированием.',
    scopeBoundaries:
      'Генерация кода, отображение в кабинете или приложении, сканирование на точке, привязка к покупке.',
    units: { BACKEND: 12, FRONTEND: 8, PM: 2, DESIGNER: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'LOY_BIRTHDAY_CAMPAIGNS',
    category: 'loyalty',
    iconKey: 'CalendarCheck',
    title: 'Автоматические кампании по событиям',
    summary: 'Предложения к дню рождения и другим событиям.',
    scopeBoundaries:
      'Триггеры событий, шаблон предложения, отправка по подключённому каналу, ограничение частоты, отчёт.',
    units: { BACKEND: 14, FRONTEND: 5, PM: 2, QA: 3 },
  },
  {
    code: 'LOY_CUSTOMER_SEGMENTS',
    category: 'loyalty',
    iconKey: 'Users',
    title: 'Сегменты клиентов',
    summary: 'Группировка клиентов по поведению и покупкам.',
    scopeBoundaries:
      'Условия сегмента, пересчёт состава, использование в рассылках и скидках, выгрузка сегмента.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 5 },
  },
] as const;
