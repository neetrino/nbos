import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Магазин и продажи. Базовая витрина, корзина и простой checkout входят в ядро магазина,
 * поэтому здесь только надстройки сверх ядра.
 */
export const COMMERCE_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'SHOP_PRODUCT_VARIANTS',
    category: 'commerce',
    iconKey: 'Boxes',
    title: 'Варианты товара',
    summary: 'Размеры, цвета и другие варианты с собственными ценами и остатками.',
    scopeBoundaries:
      'Матрица вариантов, цена и остаток на вариант, выбор на карточке товара, поведение в корзине и заказе.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 2, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'SHOP_CATALOG_FILTERS',
    category: 'commerce',
    iconKey: 'Filter',
    title: 'Фильтры каталога',
    summary: 'Фильтрация товаров по характеристикам, цене и наличию.',
    scopeBoundaries:
      'Согласованный набор характеристик, комбинирование фильтров, поведение на мобильном, скорость на текущем объёме каталога.',
    units: { BACKEND: 12, FRONTEND: 10, PM: 2, DESIGNER: 2, QA: 3 },
  },
  {
    code: 'SHOP_ADVANCED_SEARCH',
    category: 'commerce',
    iconKey: 'Search',
    title: 'Расширенный поиск по каталогу',
    summary: 'Поиск с подсказками, опечатками и ранжированием.',
    scopeBoundaries:
      'Индексация каталога, подсказки, устойчивость к опечаткам, ранжирование, обновление индекса при изменении товаров.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 2, QA: 4 },
  },
  {
    code: 'SHOP_WISHLIST',
    category: 'commerce',
    iconKey: 'Heart',
    title: 'Избранное',
    summary: 'Список отложенных товаров у покупателя.',
    scopeBoundaries:
      'Добавление и удаление, хранение для гостя и авторизованного, перенос в корзину.',
    units: { BACKEND: 6, FRONTEND: 5, PM: 1, QA: 2 },
  },
  {
    code: 'SHOP_PRODUCT_COMPARE',
    category: 'commerce',
    iconKey: 'Table',
    title: 'Сравнение товаров',
    summary: 'Сравнение характеристик нескольких товаров.',
    scopeBoundaries:
      'Выбор товаров, таблица характеристик, ограничение количества, поведение на мобильном.',
    units: { BACKEND: 6, FRONTEND: 7, PM: 1, DESIGNER: 2, QA: 2 },
  },
  {
    code: 'SHOP_REVIEWS',
    category: 'commerce',
    iconKey: 'Star',
    title: 'Отзывы и рейтинги',
    summary: 'Отзывы покупателей с модерацией и оценкой.',
    scopeBoundaries:
      'Форма отзыва, модерация, средний рейтинг, защита от спама. Ответы магазина входят, ветвление обсуждений — нет.',
    units: { BACKEND: 12, FRONTEND: 7, PM: 2, DESIGNER: 2, QA: 3 },
  },
  {
    code: 'SHOP_STOCK_MANAGEMENT',
    category: 'commerce',
    iconKey: 'Warehouse',
    title: 'Учёт остатков',
    summary: 'Остатки по складам с резервированием при заказе.',
    scopeBoundaries:
      'Остатки по складам, резерв при заказе, списание при выдаче, поведение при нуле. Интеграция с внешним складом — отдельная карточка.',
    units: { BACKEND: 20, FRONTEND: 6, PM: 3, QA: 5 },
  },
  {
    code: 'SHOP_MULTI_BRANCH',
    category: 'commerce',
    iconKey: 'Building',
    title: 'Несколько филиалов и точек выдачи',
    summary: 'Разные цены, остатки и самовывоз по филиалам.',
    scopeBoundaries:
      'Справочник филиалов, цены и остатки на филиал, выбор точки в checkout, ограничения доставки.',
    units: { BACKEND: 22, FRONTEND: 8, PM: 3, QA: 5 },
  },
  {
    code: 'SHOP_CUSTOM_CHECKOUT',
    category: 'commerce',
    iconKey: 'ShoppingCart',
    title: 'Нестандартный checkout',
    summary: 'Оформление заказа со своими шагами и правилами.',
    scopeBoundaries:
      'Отличия от базового сценария, дополнительные поля и валидация, совместимость с оплатой и доставкой, мобильный сценарий.',
    units: { BACKEND: 16, FRONTEND: 12, PM: 3, DESIGNER: 4, QA: 4 },
  },
  {
    code: 'SHOP_B2B_PRICING',
    category: 'commerce',
    iconKey: 'Briefcase',
    title: 'Оптовые и персональные цены',
    summary: 'Цены и условия для групп клиентов и B2B.',
    scopeBoundaries:
      'Группы клиентов, прайс-листы, минимальные партии, отсрочка оплаты как признак заказа. Договорные документы не входят.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 5 },
  },
  {
    code: 'SHOP_QUICK_ORDER',
    category: 'commerce',
    iconKey: 'Zap',
    title: 'Быстрый заказ в один шаг',
    summary: 'Заказ по имени и телефону без полного оформления.',
    scopeBoundaries: 'Мини-форма, валидация телефона, создание заказа, уведомление менеджера.',
    units: { BACKEND: 6, FRONTEND: 5, PM: 1, DESIGNER: 1, QA: 2 },
  },
  {
    code: 'SHOP_ABANDONED_CART',
    category: 'commerce',
    iconKey: 'ShoppingCart',
    title: 'Брошенная корзина',
    summary: 'Напоминание о незавершённом заказе.',
    scopeBoundaries:
      'Фиксация брошенной корзины, правила и задержка напоминания, отправка по уже подключённому каналу, отписка.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3 },
  },
  {
    code: 'SHOP_PRICE_RULES',
    category: 'commerce',
    iconKey: 'SlidersHorizontal',
    title: 'Правила скидок и акций',
    summary: 'Автоматические скидки по условиям корзины.',
    scopeBoundaries:
      'Условия и приоритет правил, сочетание с промокодами, ограничения по времени и товарам, пересчёт корзины.',
    units: { BACKEND: 20, FRONTEND: 7, PM: 3, QA: 5 },
  },
  {
    code: 'SHOP_DIGITAL_GOODS',
    category: 'commerce',
    iconKey: 'Download',
    title: 'Продажа цифровых товаров',
    summary: 'Выдача файлов или доступов после оплаты.',
    scopeBoundaries:
      'Привязка файла или доступа к товару, выдача после оплаты, ограничение по ссылке и времени, повторная выдача.',
    units: { BACKEND: 14, FRONTEND: 5, PM: 2, QA: 3 },
  },
  {
    code: 'SHOP_MARKETPLACE_VENDORS',
    category: 'commerce',
    iconKey: 'Store',
    title: 'Мультивендор',
    summary: 'Изолированные продавцы со своими каталогами и заказами.',
    scopeBoundaries:
      'Изоляция продавцов, их каталогов и заказов, кабинет продавца, комиссия магазина. Автоматические выплаты продавцам — отдельная карточка.',
    units: { BACKEND: 45, FRONTEND: 20, PM: 6, DESIGNER: 6, QA: 10, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'SHOP_RETURN_REQUESTS',
    category: 'commerce',
    iconKey: 'RefreshCw',
    title: 'Заявки на возврат товара',
    summary: 'Оформление и обработка возвратов покупателем.',
    scopeBoundaries:
      'Заявка покупателя, статусы обработки, причины, связь с возвратом денег, уведомления.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 3 },
  },
] as const;
