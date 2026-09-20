import type { CatalogSeedItem } from './catalog-seed-types';

/** Платформенные надстройки: инфраструктура, масштаб, надёжность и администрирование. */
export const PLATFORM_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'PLT_ADMIN_PANEL_EXTENDED',
    category: 'platform',
    iconKey: 'Layout',
    title: 'Расширенная админка',
    summary: 'Административная часть сверх базовой.',
    scopeBoundaries:
      'Дополнительные разделы и массовые операции, права на разделы, журнал действий. Базовая админка входит в ядра продуктов, где она предусмотрена.',
    units: { BACKEND: 20, FRONTEND: 18, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'PLT_MULTI_TENANCY',
    category: 'platform',
    iconKey: 'Boxes',
    title: 'Мультиарендность',
    summary: 'Несколько независимых организаций в одной системе.',
    scopeBoundaries:
      'Изоляция данных и настроек, выбор арендатора, ограничение прав, влияние на отчёты и производительность.',
    units: { BACKEND: 40, FRONTEND: 14, PM: 5, QA: 10, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'PLT_CUSTOM_DOMAINS',
    category: 'platform',
    iconKey: 'Globe',
    title: 'Собственные домены клиентов',
    summary: 'Подключение домена клиента с сертификатом.',
    scopeBoundaries:
      'Привязка домена, выпуск и обновление сертификата, проверка владения, обработка ошибок DNS.',
    units: { BACKEND: 16, FRONTEND: 6, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 5 },
  },
  {
    code: 'PLT_WHITE_LABEL',
    category: 'platform',
    iconKey: 'Palette',
    title: 'White label оформление',
    summary: 'Логотип, цвета и названия под бренд клиента.',
    scopeBoundaries:
      'Настраиваемые логотип, цвета и тексты, применение в интерфейсе и письмах, предпросмотр.',
    units: { BACKEND: 12, FRONTEND: 16, PM: 3, DESIGNER: 5, QA: 4 },
  },
  {
    code: 'PLT_PERFORMANCE_HARDENING',
    category: 'platform',
    iconKey: 'Zap',
    title: 'Оптимизация под нагрузку',
    summary: 'Ускорение продукта под большой объём данных и трафика.',
    scopeBoundaries:
      'Согласованные целевые показатели, профилирование, индексы и кеширование, замер до и после. Смена архитектуры не входит.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'PLT_CACHING_LAYER',
    category: 'platform',
    iconKey: 'Server',
    title: 'Слой кеширования',
    summary: 'Кеш для тяжёлых запросов и страниц.',
    scopeBoundaries:
      'Что кешируется и на сколько, инвалидация при изменениях, поведение при недоступности кеша.',
    units: { BACKEND: 18, FRONTEND: 4, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'PLT_BACKUP_RESTORE',
    category: 'platform',
    iconKey: 'HardDrive',
    title: 'Резервное копирование и восстановление',
    summary: 'Регулярные копии с проверенным восстановлением.',
    scopeBoundaries:
      'Расписание и хранение копий, проверка восстановления на отдельной среде, инструкция для клиента.',
    units: { BACKEND: 10, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 8 },
  },
  {
    code: 'PLT_MONITORING_ALERTS',
    category: 'platform',
    iconKey: 'Gauge',
    title: 'Мониторинг и оповещения',
    summary: 'Наблюдение за доступностью и ошибками.',
    scopeBoundaries:
      'Метрики и порог оповещения, канал уведомления дежурного, сбор ошибок, панель состояния.',
    units: { BACKEND: 12, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 8 },
  },
  {
    code: 'PLT_CUSTOM_DEPLOYMENT',
    category: 'platform',
    iconKey: 'Rocket',
    title: 'Нестандартное развёртывание',
    summary: 'Дополнительные окружения или инфраструктура клиента.',
    scopeBoundaries:
      'Дополнительные окружения относительно базы, воспроизводимые шаги, проверка доступности, передача команде клиента.',
    units: { BACKEND: 10, PM: 3, QA: 3, TECHNICAL_SPECIALIST: 12 },
  },
  {
    code: 'PLT_ON_PREMISE_SETUP',
    category: 'platform',
    iconKey: 'Server',
    title: 'Установка на сервере клиента',
    summary: 'Развёртывание в инфраструктуре заказчика.',
    scopeBoundaries:
      'Требования к серверу, установка и настройка, обновления, инструкция администратора. Постоянное администрирование не входит.',
    units: { BACKEND: 12, PM: 4, QA: 4, TECHNICAL_SPECIALIST: 16 },
  },
  {
    code: 'PLT_FEATURE_FLAGS',
    category: 'platform',
    iconKey: 'SlidersHorizontal',
    title: 'Управление функциями на лету',
    summary: 'Включение и отключение возможностей без релиза.',
    scopeBoundaries:
      'Справочник флагов, область действия, аудит изменений, безопасные значения по умолчанию.',
    units: { BACKEND: 14, FRONTEND: 8, PM: 2, QA: 4 },
  },
  {
    code: 'PLT_ACCESSIBILITY_PASS',
    category: 'platform',
    iconKey: 'LifeBuoy',
    title: 'Доступность интерфейса',
    summary: 'Приведение интерфейса к требованиям доступности.',
    scopeBoundaries:
      'Согласованный уровень требований и перечень экранов, клавиатурная навигация, контраст, семантика и ARIA, проверка скринридером.',
    units: { FRONTEND: 18, PM: 2, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'PLT_SECURITY_HARDENING',
    category: 'platform',
    iconKey: 'Shield',
    title: 'Усиление безопасности',
    summary: 'Проверка и закрытие уязвимостей продукта.',
    scopeBoundaries:
      'Согласованный перечень проверяемых поверхностей, отчёт о найденном и исправление уязвимостей высокого и критического уровня, заголовки и лимиты, повторная проверка. Средние и низкие находки, переработка архитектуры и сертификация не входят.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 6 },
  },
] as const;
