/**
 * Draft catalog skeleton from `docs/implementation/delivery-compensation/04-CATALOG-BOOTSTRAP.md`.
 * Content only: no units, no rates, no assignments. The Owner publishes money separately.
 */
export type DeliveryCatalogSeedItem = {
  code: string;
  category: string;
  iconKey: string;
  title: string;
  summary: string;
  scopeBoundaries: string;
};

export const DELIVERY_CATALOG_SEED_ITEMS: readonly DeliveryCatalogSeedItem[] = [
  {
    code: 'BANK_PAYMENT',
    category: 'payments',
    iconKey: 'credit-card',
    title: 'Банковская оплата',
    summary: 'Подключение одного согласованного платёжного шлюза в продукте клиента.',
    scopeBoundaries:
      'Один согласованный gateway: checkout, подтверждение платежа, обработка повторных событий и ошибок, тестовый успешный и неуспешный сценарий.',
  },
  {
    code: 'WAREHOUSE_INTEGRATION',
    category: 'integrations',
    iconKey: 'warehouse',
    title: 'Интеграция со складом',
    summary: 'Обмен товарами, остатками и заказами с одной складской системой.',
    scopeBoundaries:
      'Одна внешняя система, согласованные товары, остатки и заказы, направление обмена, retry и сверка.',
  },
  {
    code: 'ERP_INTEGRATION',
    category: 'integrations',
    iconKey: 'building-2',
    title: 'Интеграция с ERP',
    summary: 'Обмен согласованными сущностями с одной ERP-системой.',
    scopeBoundaries:
      'Согласованные сущности и mapping одной ERP, права доступа, обработка ошибок, повторный обмен без дублей.',
  },
  {
    code: 'CRM_INTEGRATION',
    category: 'integrations',
    iconKey: 'users',
    title: 'Интеграция с внешней CRM',
    summary: 'Передача лидов, заказов и контактов во внешнюю CRM.',
    scopeBoundaries:
      'Согласованная передача лидов, заказов и контактов, source mapping, авторизация, обработка ошибок.',
  },
  {
    code: 'CATALOG_IMPORT',
    category: 'services',
    iconKey: 'upload',
    title: 'Массовый импорт каталога',
    summary: 'Разовая заливка товаров из согласованного источника.',
    scopeBoundaries:
      'Источник, mapping, медиа, дубли, обновление, пробный импорт и сверка. Объём задаётся градацией по количеству позиций.',
  },
  {
    code: 'DATA_MIGRATION',
    category: 'services',
    iconKey: 'database',
    title: 'Миграция данных',
    summary: 'Перенос согласованного legacy-набора данных в новый продукт.',
    scopeBoundaries:
      'Согласованный legacy dataset, очистка и mapping, dry-run, сохранность связей, план переключения.',
  },
  {
    code: 'DELIVERY_PROVIDER',
    category: 'logistics',
    iconKey: 'truck',
    title: 'Интеграция службы доставки',
    summary: 'Подключение одной службы доставки с расчётом и трекингом.',
    scopeBoundaries:
      'Один provider, расчёт и создание отправления, tracking и status mapping, обработка ошибок.',
  },
  {
    code: 'CUSTOM_CHECKOUT',
    category: 'payments',
    iconKey: 'shopping-cart',
    title: 'Нестандартный checkout',
    summary: 'Оформление заказа, отличающееся от базового сценария.',
    scopeBoundaries:
      'Отличия от базового checkout, валидация, совместимость оплаты и доставки, мобильный сценарий.',
  },
  {
    code: 'MULTILINGUAL_CONTENT',
    category: 'content',
    iconKey: 'languages',
    title: 'Дополнительная языковая версия',
    summary: 'Ещё один язык интерфейса и контента.',
    scopeBoundaries:
      'Согласованные языки, маршруты и переключение, контент и fallback. Стоимость перевода в объём не входит автоматически.',
  },
  {
    code: 'ADVANCED_SEARCH',
    category: 'content',
    iconKey: 'search',
    title: 'Расширенный поиск',
    summary: 'Поиск с фильтрами и ранжированием по согласованному каталогу.',
    scopeBoundaries:
      'Согласованный каталог, фильтры и ранжирование, обновление индекса, контрольные сценарии.',
  },
  {
    code: 'CUSTOMER_PORTAL',
    category: 'accounts',
    iconKey: 'user-circle',
    title: 'Личный кабинет клиента',
    summary: 'Кабинет с доступом к своим данным и истории операций.',
    scopeBoundaries:
      'Согласованные экраны, авторизация, доступ только к своим данным, история операций.',
  },
  {
    code: 'ADVANCED_ROLES',
    category: 'accounts',
    iconKey: 'shield',
    title: 'Сложные роли и права',
    summary: 'Матрица прав на действия и данные с серверными ограничениями.',
    scopeBoundaries: 'Матрица действий и данных, серверные ограничения, тесты запретов.',
  },
  {
    code: 'MARKETPLACE_VENDORS',
    category: 'platform',
    iconKey: 'store',
    title: 'Мультивендор',
    summary: 'Изоляция продавцов, их каталогов и заказов.',
    scopeBoundaries:
      'Согласованная изоляция продавцов, каталогов и заказов. Финансовые выплаты продавцам входят только при явном согласовании.',
  },
  {
    code: 'BOOKING_FLOW',
    category: 'platform',
    iconKey: 'calendar-check',
    title: 'Запись и бронирование',
    summary: 'Бронирование ресурсов с проверкой доступности.',
    scopeBoundaries: 'Ресурсы, доступность, отмена и перенос, защита от двойного бронирования.',
  },
  {
    code: 'RECURRING_CHECKOUT',
    category: 'payments',
    iconKey: 'repeat',
    title: 'Подписочная оплата в продукте клиента',
    summary: 'Разовая реализация регулярных списаний у клиента.',
    scopeBoundaries:
      'Разовая реализация customer billing-flow. Это не ежемесячная работа и не ежемесячный бонус команде.',
  },
  {
    code: 'CUSTOM_REPORTS',
    category: 'content',
    iconKey: 'bar-chart-3',
    title: 'Нестандартные отчёты',
    summary: 'Отчёты по согласованным метрикам и источникам.',
    scopeBoundaries: 'Согласованный набор метрик, источников и выгрузок, контроль расчётов.',
  },
  {
    code: 'EXTERNAL_AUTH',
    category: 'accounts',
    iconKey: 'key-round',
    title: 'Внешняя авторизация и SSO',
    summary: 'Вход через одного согласованного внешнего провайдера.',
    scopeBoundaries:
      'Один согласованный provider, привязка аккаунта, вход, выход, ошибки и security review.',
  },
  {
    code: 'NOTIFICATION_INTEGRATION',
    category: 'messaging',
    iconKey: 'bell',
    title: 'Внешний канал уведомлений',
    summary: 'Отправка событий продукта через внешний канал.',
    scopeBoundaries: 'Один provider и канал, согласованные события, retry, dedup и приватность.',
  },
  {
    code: 'ONE_TIME_SEO_SETUP',
    category: 'services',
    iconKey: 'trending-up',
    title: 'Разовая техническая SEO-настройка',
    summary: 'Технический аудит и исправления без ежемесячного продвижения.',
    scopeBoundaries:
      'Согласованный аудит и исправления, sitemap, индексация, meta и отчёт. Ежемесячное продвижение не входит.',
  },
  {
    code: 'ADVANCED_ANALYTICS',
    category: 'integrations',
    iconKey: 'activity',
    title: 'Расширенная аналитика продукта',
    summary: 'Событийная аналитика по согласованной карте событий.',
    scopeBoundaries:
      'Согласованная event map и provider, consent при необходимости, тест событий и отчёт.',
  },
  {
    code: 'CUSTOM_DEPLOYMENT',
    category: 'platform',
    iconKey: 'server',
    title: 'Нестандартное развёртывание',
    summary: 'Дополнительные окружения или инфраструктура сверх базовой.',
    scopeBoundaries:
      'Дополнительные окружения и инфраструктура относительно базы, воспроизводимые шаги, проверка доступности, передача команде.',
  },
] as const;

export const SEED_INSTRUCTIONS_PLACEHOLDER =
  'Шаги исполнения заполняет специалист по реальной практике перед публикацией карточки.';

export const SEED_ACCEPTANCE_PLACEHOLDER =
  'Критерии приёмки уточняет ответственный специалист перед публикацией карточки.';
