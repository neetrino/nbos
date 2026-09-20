import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Мобильные возможности. Одинаковый функционал в вебе и в приложении стоит одинаково — решение
 * владельца; здесь только то, что существует именно в приложении и в вебе не имеет смысла.
 */
export const MOBILE_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'MOB_PUSH_NOTIFICATIONS',
    category: 'mobile',
    iconKey: 'Bell',
    title: 'Push-уведомления в приложении',
    summary: 'Отправка push на устройства пользователей.',
    scopeBoundaries:
      'Провайдер доставки, регистрация устройств, отправка по событиям и вручную, разрешения и отписка, поведение iOS и Android.',
    units: { BACKEND: 16, FRONTEND: 10, PM: 2, QA: 5, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'MOB_OFFLINE_MODE',
    category: 'mobile',
    iconKey: 'Cloud',
    title: 'Работа без интернета',
    summary: 'Локальные данные и синхронизация после подключения.',
    scopeBoundaries:
      'Согласованный объём офлайн-данных, локальное хранение, синхронизация и разрешение конфликтов, индикация состояния.',
    units: { BACKEND: 20, FRONTEND: 30, PM: 4, QA: 9 },
  },
  {
    code: 'MOB_IN_APP_PURCHASE',
    category: 'mobile',
    iconKey: 'CreditCard',
    title: 'Внутренние покупки',
    summary: 'Покупки и подписки через App Store и Google Play.',
    scopeBoundaries:
      'Товары и подписки в кабинетах магазинов, проверка чеков на сервере, восстановление покупок, требования сторов.',
    units: { BACKEND: 22, FRONTEND: 16, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'MOB_DEEP_LINKS',
    category: 'mobile',
    iconKey: 'Route',
    title: 'Глубокие ссылки',
    summary: 'Переход из ссылки в нужный экран приложения.',
    scopeBoundaries:
      'Схемы ссылок и универсальные ссылки, поведение без установленного приложения, проверка на обеих платформах.',
    units: { BACKEND: 6, FRONTEND: 10, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'MOB_CAMERA_SCANNER',
    category: 'mobile',
    iconKey: 'QrCode',
    title: 'Сканер камерой',
    summary: 'Сканирование QR и штрихкодов в приложении.',
    scopeBoundaries:
      'Разрешения камеры, распознавание кодов, обработка ошибок, поведение при плохом свете.',
    units: { FRONTEND: 12, BACKEND: 4, PM: 2, QA: 4 },
  },
  {
    code: 'MOB_GEOLOCATION',
    category: 'mobile',
    iconKey: 'MapPin',
    title: 'Геолокация и фоновое отслеживание',
    summary: 'Местоположение пользователя в приложении.',
    scopeBoundaries:
      'Разрешения, точность и частота, фоновый режим при согласовании, расход батареи, требования сторов к обоснованию.',
    units: { BACKEND: 12, FRONTEND: 16, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'MOB_STORE_PUBLISHING',
    category: 'mobile',
    iconKey: 'Rocket',
    title: 'Публикация в сторах',
    summary: 'Выпуск приложения в App Store и Google Play.',
    scopeBoundaries:
      'Аккаунты клиента, сборки и подписи, метаданные и скриншоты, прохождение ревью, первый релиз. Последующие релизы — отдельная услуга.',
    units: { PM: 4, DESIGNER: 4, QA: 4, TECHNICAL_SPECIALIST: 12 },
  },
  {
    code: 'MOB_APP_UPDATE_GATE',
    category: 'mobile',
    iconKey: 'RefreshCw',
    title: 'Принудительное обновление версии',
    summary: 'Требование обновиться при устаревшей версии.',
    scopeBoundaries:
      'Проверка версии, экран обновления, мягкое и жёсткое требование, обход для тестов.',
    units: { BACKEND: 6, FRONTEND: 6, PM: 1, QA: 3 },
  },
  {
    code: 'MOB_TABLET_LAYOUT',
    category: 'mobile',
    iconKey: 'Monitor',
    title: 'Раскладка для планшетов',
    summary: 'Интерфейс, рассчитанный на большой экран.',
    scopeBoundaries:
      'Согласованные экраны, поведение при повороте, разделённые панели, проверка на планшете.',
    units: { FRONTEND: 18, PM: 2, DESIGNER: 6, QA: 4 },
  },
  {
    code: 'MOB_WEARABLE_COMPANION',
    category: 'mobile',
    iconKey: 'Timer',
    title: 'Компаньон для часов',
    summary: 'Ограниченный интерфейс на умных часах.',
    scopeBoundaries:
      'Одна платформа часов, согласованный минимум экранов, синхронизация с телефоном, уведомления.',
    units: { BACKEND: 6, FRONTEND: 20, PM: 3, DESIGNER: 5, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
] as const;
