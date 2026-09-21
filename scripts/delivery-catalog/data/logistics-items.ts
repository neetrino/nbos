import type { CatalogSeedItem } from './catalog-seed-types';

/** Доставка и логистика. Каждая служба — своя карточка, потому что API и статусы у них разные. */
export const LOGISTICS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'LOG_DELIVERY_ZONES',
    category: 'logistics',
    iconKey: 'Map',
    title: 'Зоны и тарифы доставки',
    summary: 'Расчёт стоимости доставки по зонам и весу.',
    scopeBoundaries:
      'Справочник зон, правила расчёта по весу и сумме, бесплатный порог, отображение в checkout.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 3 },
  },
  {
    code: 'LOG_PICKUP_POINTS',
    category: 'logistics',
    iconKey: 'MapPin',
    title: 'Самовывоз и точки выдачи',
    summary: 'Выбор точки получения заказа на карте или из списка.',
    scopeBoundaries:
      'Справочник точек, выбор в checkout, график работы, уведомление о готовности. Карта входит, если провайдер карт уже подключён.',
    units: { BACKEND: 10, FRONTEND: 7, PM: 2, DESIGNER: 2, QA: 3 },
  },
  {
    code: 'LOG_HAYPOST',
    category: 'logistics',
    iconKey: 'Truck',
    title: 'Интеграция Haypost',
    summary: 'Создание отправлений и трекинг через Haypost.',
    scopeBoundaries:
      'Расчёт стоимости, создание отправления, печать накладной, трекинг и сопоставление статусов, обработка ошибок.',
    units: { BACKEND: 16, FRONTEND: 5, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'LOG_COURIER_PROVIDER',
    category: 'logistics',
    iconKey: 'Truck',
    title: 'Интеграция курьерской службы',
    summary: 'Подключение одной курьерской службы с расчётом и трекингом.',
    scopeBoundaries:
      'Один provider: расчёт, создание отправления, трекинг, сопоставление статусов. Каждая следующая служба — отдельная карточка.',
    units: { BACKEND: 16, FRONTEND: 5, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'LOG_OWN_COURIER_APP',
    category: 'logistics',
    iconKey: 'Route',
    title: 'Кабинет своего курьера',
    summary: 'Список доставок и смена статуса для собственного курьера.',
    scopeBoundaries:
      'Роль курьера, его заказы на день, смена статуса и подтверждение выдачи, фото или подпись при получении.',
    units: { BACKEND: 20, FRONTEND: 14, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'LOG_DELIVERY_SLOTS',
    category: 'logistics',
    iconKey: 'CalendarClock',
    title: 'Интервалы доставки',
    summary: 'Выбор даты и времени доставки с ограничением загрузки.',
    scopeBoundaries:
      'Календарь интервалов, лимит заказов на интервал, блокировка занятых, перенос даты менеджером.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 2, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'LOG_ORDER_TRACKING_PAGE',
    category: 'logistics',
    iconKey: 'Route',
    title: 'Страница отслеживания заказа',
    summary: 'Публичная страница статуса заказа по ссылке или номеру.',
    scopeBoundaries:
      'Доступ по защищённой ссылке, этапы заказа, данные перевозчика при наличии интеграции.',
    units: { BACKEND: 8, FRONTEND: 6, PM: 1, DESIGNER: 2, QA: 2 },
  },
  {
    code: 'LOG_WAREHOUSE_OPERATIONS',
    category: 'logistics',
    iconKey: 'Package',
    title: 'Складские операции',
    summary: 'Приёмка, перемещение и инвентаризация на складе.',
    scopeBoundaries:
      'Приёмка, перемещение между складами, инвентаризация с расхождениями, журнал операций и права.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 4, QA: 6 },
  },
  {
    code: 'LOG_BARCODE_SCANNING',
    category: 'logistics',
    iconKey: 'ScanLine',
    title: 'Работа со штрихкодами',
    summary: 'Сканирование товаров при приёмке и сборке заказа.',
    scopeBoundaries:
      'Ввод со сканера или камеры, сопоставление с товаром, ускоренная сборка заказа, ошибки сканирования.',
    units: { BACKEND: 12, FRONTEND: 10, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'LOG_LABEL_PRINTING',
    category: 'logistics',
    iconKey: 'Printer',
    title: 'Печать накладных и этикеток',
    summary: 'Формирование печатных документов для отправлений.',
    scopeBoundaries:
      'Шаблоны документов, печать одной и пачки, размеры этикеток, проверка на реальном принтере.',
    units: { BACKEND: 10, FRONTEND: 6, PM: 2, DESIGNER: 2, QA: 3, TECHNICAL_SPECIALIST: 4 },
  },
] as const;
