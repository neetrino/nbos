import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Аккаунты, доступы и права. Простая регистрация и базовый кабинет входят в ядра тех продуктов,
 * где они предусмотрены; здесь — всё, что сверх этого.
 */
export const ACCOUNTS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'ACC_CUSTOMER_PORTAL',
    category: 'accounts',
    iconKey: 'UserCircle',
    title: 'Личный кабинет клиента',
    summary: 'Кабинет с профилем, историей и своими данными.',
    scopeBoundaries:
      'Согласованные разделы кабинета, доступ только к своим данным, история операций, смена пароля и данных профиля.',
    units: { BACKEND: 18, FRONTEND: 14, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'ACC_SOCIAL_LOGIN',
    category: 'accounts',
    iconKey: 'KeyRound',
    title: 'Вход через внешний аккаунт',
    summary: 'Авторизация через Google, Apple или Facebook.',
    scopeBoundaries:
      'Один провайдер, привязка к существующему аккаунту, вход и выход, обработка отказов. Каждый следующий провайдер — отдельная карточка.',
    units: { BACKEND: 10, FRONTEND: 4, PM: 1, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'ACC_SSO_ENTERPRISE',
    category: 'accounts',
    iconKey: 'Lock',
    title: 'Корпоративный SSO',
    summary: 'Единый вход через корпоративного провайдера.',
    scopeBoundaries:
      'Один провайдер SAML или OIDC, сопоставление пользователей и ролей, выход, security review.',
    units: { BACKEND: 22, FRONTEND: 6, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'ACC_TWO_FACTOR',
    category: 'accounts',
    iconKey: 'Shield',
    title: 'Двухфакторная аутентификация',
    summary: 'Второй фактор входа по приложению или SMS.',
    scopeBoundaries:
      'Один способ второго фактора, включение и отключение пользователем, резервные коды, восстановление доступа.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'ACC_ROLE_MATRIX',
    category: 'accounts',
    iconKey: 'Shield',
    title: 'Сложные роли и права',
    summary: 'Матрица прав на действия и данные.',
    scopeBoundaries:
      'Роли, права на действия и на объём данных, серверные проверки, тесты запретов, интерфейс настройки.',
    units: { BACKEND: 30, FRONTEND: 14, PM: 4, DESIGNER: 3, QA: 8 },
  },
  {
    code: 'ACC_TEAM_ACCOUNTS',
    category: 'accounts',
    iconKey: 'Users',
    title: 'Командные аккаунты',
    summary: 'Один клиент с несколькими пользователями и ролями.',
    scopeBoundaries:
      'Организация и её участники, приглашения, роли внутри организации, изоляция данных между организациями.',
    units: { BACKEND: 26, FRONTEND: 14, PM: 4, DESIGNER: 3, QA: 6 },
  },
  {
    code: 'ACC_BIOMETRIC_LOGIN',
    category: 'accounts',
    iconKey: 'Fingerprint',
    title: 'Биометрический вход',
    summary: 'Вход по отпечатку или лицу в приложении.',
    scopeBoundaries:
      'Включение и отключение, запасной способ входа, поведение при смене устройства, требования платформ.',
    units: { BACKEND: 8, FRONTEND: 10, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'ACC_AUDIT_LOG',
    category: 'accounts',
    iconKey: 'ClipboardList',
    title: 'Журнал действий пользователей',
    summary: 'Кто и что изменил, с историей значений.',
    scopeBoundaries:
      'Согласованный перечень отслеживаемых действий, хранение до и после, фильтры и поиск, права на просмотр.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 2, QA: 4 },
  },
  {
    code: 'ACC_IMPERSONATION',
    category: 'accounts',
    iconKey: 'UserPlus',
    title: 'Вход под клиентом для поддержки',
    summary: 'Просмотр интерфейса от имени пользователя.',
    scopeBoundaries:
      'Права на операцию, явный признак режима в интерфейсе, журнал входов, ограничение действий. Требует security review.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'ACC_GDPR_DATA_REQUESTS',
    category: 'accounts',
    iconKey: 'FileText',
    title: 'Выгрузка и удаление персональных данных',
    summary: 'Запросы пользователя на свои данные и их удаление.',
    scopeBoundaries:
      'Выгрузка данных пользователя, удаление с сохранением обязательной отчётности, журнал запросов, сроки исполнения.',
    units: { BACKEND: 16, FRONTEND: 6, PM: 3, QA: 4 },
  },
] as const;
