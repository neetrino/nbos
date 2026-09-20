import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * CRM и внутренние процессы. Категория показывает направление, а не ограничение: задачи или
 * канбан из этого блока спокойно выбираются и для магазина, если клиенту нужен такой модуль.
 */
export const CRM_OPS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'CRM_CONTACTS_COMPANIES',
    category: 'crm_ops',
    iconKey: 'Contact',
    title: 'Контакты и компании',
    summary: 'Справочник клиентов с историей взаимодействий.',
    scopeBoundaries:
      'Карточки контактов и компаний, связи между ними, история, поиск и фильтры, дубли.',
    units: { BACKEND: 20, FRONTEND: 14, PM: 3, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'CRM_PIPELINE',
    category: 'crm_ops',
    iconKey: 'KanbanSquare',
    title: 'Воронка сделок',
    summary: 'Сделки по этапам с перемещением и суммами.',
    scopeBoundaries:
      'Этапы воронки, перемещение сделки, обязательные поля этапа, причины отказа, сумма и прогноз.',
    units: { BACKEND: 26, FRONTEND: 20, PM: 4, DESIGNER: 5, QA: 7 },
  },
  {
    code: 'CRM_LEAD_CAPTURE',
    category: 'crm_ops',
    iconKey: 'UserPlus',
    title: 'Приём заявок в CRM',
    summary: 'Заявки с сайта и каналов попадают в систему.',
    scopeBoundaries:
      'Источники заявок, распределение на ответственного, дедупликация, уведомление, фиксация источника.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 3, QA: 4 },
  },
  {
    code: 'CRM_TASKS',
    category: 'crm_ops',
    iconKey: 'ListChecks',
    title: 'Задачи и напоминания',
    summary: 'Задачи с исполнителем, сроком и статусом.',
    scopeBoundaries:
      'Создание и назначение, сроки и напоминания, статусы, связь с клиентом или сделкой, мои задачи.',
    units: { BACKEND: 18, FRONTEND: 14, PM: 3, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'CRM_TASK_BOARD',
    category: 'crm_ops',
    iconKey: 'KanbanSquare',
    title: 'Канбан-доска задач',
    summary: 'Доска с колонками и перетаскиванием.',
    scopeBoundaries:
      'Колонки и порядок, перетаскивание, фильтры и участники, лимиты колонок. Диаграммы Ганта не входят.',
    units: { BACKEND: 14, FRONTEND: 20, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'CRM_WORKFLOW_AUTOMATION',
    category: 'crm_ops',
    iconKey: 'GitBranch',
    title: 'Автоматизация процессов',
    summary: 'Правила «если событие — то действие».',
    scopeBoundaries:
      'Согласованный набор триггеров и действий, условия, журнал выполнения, защита от циклов. Визуальный конструктор — отдельная карточка.',
    units: { BACKEND: 30, FRONTEND: 12, PM: 4, QA: 8 },
  },
  {
    code: 'CRM_WORKFLOW_BUILDER',
    category: 'crm_ops',
    iconKey: 'GitBranch',
    title: 'Визуальный конструктор процессов',
    summary: 'Сборка сценариев мышью на схеме.',
    scopeBoundaries:
      'Схема из блоков, связи и условия, проверка перед публикацией, версии сценария, журнал запусков.',
    units: { BACKEND: 34, FRONTEND: 34, PM: 5, DESIGNER: 6, QA: 10 },
  },
  {
    code: 'CRM_CALL_LOG',
    category: 'crm_ops',
    iconKey: 'Phone',
    title: 'Журнал звонков и обращений',
    summary: 'История обращений клиента по всем каналам.',
    scopeBoundaries:
      'Единая история по каналам, привязка к клиенту и сделке, результат обращения, поиск и фильтры.',
    units: { BACKEND: 16, FRONTEND: 10, PM: 2, QA: 4 },
  },
  {
    code: 'CRM_QUOTES',
    category: 'crm_ops',
    iconKey: 'FileText',
    title: 'Коммерческие предложения',
    summary: 'Формирование и отправка КП клиенту.',
    scopeBoundaries:
      'Состав предложения, расчёт суммы, печатная форма и отправка, версии и статусы, принятие клиентом.',
    units: { BACKEND: 20, FRONTEND: 12, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'CRM_CONTRACTS',
    category: 'crm_ops',
    iconKey: 'FileText',
    title: 'Договоры и подписание',
    summary: 'Договоры со статусами и файлами.',
    scopeBoundaries:
      'Шаблоны и нумерация, статусы согласования, файлы и версии, сроки. Электронная подпись — отдельная карточка.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, QA: 5 },
  },
  {
    code: 'CRM_ESIGNATURE',
    category: 'crm_ops',
    iconKey: 'Fingerprint',
    title: 'Электронная подпись документов',
    summary: 'Подписание документов через провайдера.',
    scopeBoundaries:
      'Один провайдер подписи, отправка на подпись, статусы, хранение подписанного файла, журнал.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'CRM_SUPPORT_TICKETS',
    category: 'crm_ops',
    iconKey: 'LifeBuoy',
    title: 'Тикеты поддержки',
    summary: 'Обращения клиентов с очередью и сроками.',
    scopeBoundaries:
      'Создание из канала или кабинета, очередь и назначение, статусы и сроки реакции, история переписки.',
    units: { BACKEND: 24, FRONTEND: 16, PM: 4, DESIGNER: 4, QA: 6 },
  },
] as const;
