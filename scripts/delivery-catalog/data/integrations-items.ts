import type { CatalogSeedItem } from './catalog-seed-types';

/** Интеграции с внешними системами. Одна карточка — одна внешняя система и одно направление. */
export const INTEGRATIONS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'INT_1C',
    category: 'integrations',
    iconKey: 'Database',
    title: 'Интеграция с 1С',
    summary: 'Обмен товарами, остатками и заказами с 1С.',
    scopeBoundaries:
      'Согласованные сущности и направление обмена, расписание, сопоставление номенклатуры, повторный обмен без дублей, журнал ошибок.',
    units: { BACKEND: 30, FRONTEND: 6, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 6 },
  },
  {
    code: 'INT_HASHSOFT',
    category: 'integrations',
    iconKey: 'Database',
    title: 'Интеграция с ՀԾ',
    summary: 'Обмен данными с системой ՀԾ.',
    scopeBoundaries:
      'Согласованные сущности, формат и канал обмена, сопоставление справочников, обработка ошибок и повторов.',
    units: { BACKEND: 30, FRONTEND: 6, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 6 },
  },
  {
    code: 'INT_ERP_GENERIC',
    category: 'integrations',
    iconKey: 'Building2',
    title: 'Интеграция с ERP',
    summary: 'Обмен согласованными сущностями с ERP клиента.',
    scopeBoundaries:
      'Одна ERP, до пяти согласованных сущностей и их сопоставление полей, одно направление обмена на сущность, авторизация, обработка ошибок, повторный обмен без дублей. Перенос истории и каждая следующая сущность — отдельная оценка.',
    units: { BACKEND: 30, FRONTEND: 6, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 5 },
  },
  {
    code: 'INT_EXTERNAL_CRM',
    category: 'integrations',
    iconKey: 'Contact',
    title: 'Интеграция с внешней CRM',
    summary: 'Передача лидов, контактов и сделок во внешнюю CRM.',
    scopeBoundaries:
      'Одна CRM, направление и состав передачи, сопоставление полей и источников, обработка ошибок.',
    units: { BACKEND: 22, FRONTEND: 5, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'INT_WAREHOUSE_SYSTEM',
    category: 'integrations',
    iconKey: 'Warehouse',
    title: 'Интеграция с внешним складом',
    summary: 'Остатки и отгрузки из складской системы клиента.',
    scopeBoundaries:
      'Одна система, товары, остатки и отгрузки, направление обмена, сверка расхождений, повторы.',
    units: { BACKEND: 26, FRONTEND: 6, PM: 3, QA: 7, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'INT_MARKETPLACE_FEED',
    category: 'integrations',
    iconKey: 'Store',
    title: 'Выгрузка на маркетплейс',
    summary: 'Фид товаров для маркетплейса или прайс-агрегатора.',
    scopeBoundaries:
      'Один получатель, формат фида, правила отбора товаров и цен, расписание обновления, проверка приёма.',
    units: { BACKEND: 16, FRONTEND: 5, PM: 3, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'INT_MARKETPLACE_ORDERS',
    category: 'integrations',
    iconKey: 'ArrowLeftRight',
    title: 'Заказы с маркетплейса',
    summary: 'Приём заказов маркетплейса в систему.',
    scopeBoundaries:
      'Один маркетплейс, приём заказов и статусов, обратная передача статусов, остатки, обработка отмен.',
    units: { BACKEND: 26, FRONTEND: 8, PM: 4, QA: 7, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'INT_WEB_ANALYTICS',
    category: 'integrations',
    iconKey: 'LineChart',
    title: 'Веб-аналитика и события',
    summary: 'Google Analytics, Tag Manager и карта событий.',
    scopeBoundaries:
      'Один счётчик, согласованная карта событий, электронная торговля при наличии, согласие на cookies, проверка событий.',
    units: { BACKEND: 6, FRONTEND: 10, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'INT_ADS_PIXELS',
    category: 'integrations',
    iconKey: 'TrendingUp',
    title: 'Пиксели рекламных систем',
    summary: 'Передача конверсий в рекламные кабинеты.',
    scopeBoundaries:
      'Согласованные системы и события, серверные конверсии при необходимости, дедупликация, проверка в кабинете.',
    units: { BACKEND: 8, FRONTEND: 8, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'INT_MAPS',
    category: 'integrations',
    iconKey: 'Map',
    title: 'Карты и геокодирование',
    summary: 'Карта на сайте с адресами и подсказками.',
    scopeBoundaries:
      'Один провайдер карт, отображение точек, подсказки адреса, ключи и лимиты, поведение без интернета.',
    units: { BACKEND: 8, FRONTEND: 10, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'INT_PUBLIC_API',
    category: 'integrations',
    iconKey: 'Plug',
    title: 'Публичное API продукта',
    summary: 'Внешний API для партнёров клиента.',
    scopeBoundaries:
      'Согласованные методы, авторизация и ключи, лимиты запросов, версионирование, документация.',
    units: { BACKEND: 28, FRONTEND: 4, PM: 4, QA: 7, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'INT_WEBHOOKS',
    category: 'integrations',
    iconKey: 'Webhook',
    title: 'Исходящие webhooks',
    summary: 'Уведомление внешних систем о событиях.',
    scopeBoundaries:
      'Согласованные события, подписки и подпись запросов, повторы при отказе, журнал доставки.',
    units: { BACKEND: 16, FRONTEND: 6, PM: 2, QA: 4 },
  },
  {
    code: 'INT_SSO_PROVIDER_FOR_PARTNERS',
    category: 'integrations',
    iconKey: 'KeyRound',
    title: 'Единый вход для партнёрских систем',
    summary: 'Продукт выступает поставщиком входа для партнёров.',
    scopeBoundaries:
      'Один протокол, регистрация партнёрских приложений, выдача и отзыв токенов, security review.',
    units: { BACKEND: 26, FRONTEND: 6, PM: 4, QA: 7, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'INT_CATALOG_IMPORT_EXPORT',
    category: 'integrations',
    iconKey: 'ArrowLeftRight',
    title: 'Импорт и экспорт каталога в продукте',
    summary: 'Клиент сам загружает и выгружает товары файлом или по ссылке.',
    scopeBoundaries:
      'Согласованные форматы XML, YML и Excel, сопоставление полей, обновление по расписанию или по кнопке, отчёт об ошибках строк, защита от дублей. Разовая заливка силами команды — это услуга, а не эта функция.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'INT_ARMENIAN_E_INVOICING',
    category: 'integrations',
    iconKey: 'Receipt',
    title: 'Электронные счёта и отчётность в госсистему',
    summary: 'Обмен счетами и отчётами с государственной системой.',
    scopeBoundaries:
      'Одна государственная система, выпуск и отмена электронного счёта, статусы и квитанции, сопоставление номенклатуры и налогов, повторная отправка без дублей. Бухгалтерская методология и подписи на стороне клиента не входят.',
    units: { BACKEND: 22, FRONTEND: 6, PM: 3, QA: 7, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'INT_LEGACY_DB_BRIDGE',
    category: 'integrations',
    iconKey: 'HardDrive',
    title: 'Связь с legacy-базой',
    summary: 'Чтение или запись в старую базу клиента.',
    scopeBoundaries:
      'Одна база, согласованные таблицы и направление, безопасный доступ, устойчивость к недоступности, журнал.',
    units: { BACKEND: 24, FRONTEND: 4, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 5 },
  },
] as const;
