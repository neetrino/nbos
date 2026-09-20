import type { CatalogSeedItem } from './catalog-seed-types';

/** Аналитика и отчёты внутри продукта. Внешние системы аналитики — в категории интеграций. */
export const ANALYTICS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'ANL_DASHBOARD',
    category: 'analytics',
    iconKey: 'BarChart3',
    title: 'Дашборд с показателями',
    summary: 'Сводка ключевых показателей на главном экране.',
    scopeBoundaries:
      'Согласованный набор показателей, периоды сравнения, графики, права на просмотр данных.',
    units: { BACKEND: 20, FRONTEND: 16, PM: 3, DESIGNER: 5, QA: 5 },
  },
  {
    code: 'ANL_CUSTOM_REPORTS',
    category: 'analytics',
    iconKey: 'FileSpreadsheet',
    title: 'Нестандартные отчёты',
    summary: 'Отчёты по согласованным метрикам и срезам.',
    scopeBoundaries:
      'Перечень отчётов, фильтры и срезы, выгрузка, проверка расчётов на реальных данных.',
    units: { BACKEND: 22, FRONTEND: 12, PM: 3, QA: 6 },
  },
  {
    code: 'ANL_REPORT_BUILDER',
    category: 'analytics',
    iconKey: 'Table',
    title: 'Конструктор отчётов',
    summary: 'Пользователь сам собирает отчёт из полей.',
    scopeBoundaries:
      'Доступные поля и агрегаты, фильтры и группировки, сохранение отчёта, ограничение тяжёлых запросов.',
    units: { BACKEND: 34, FRONTEND: 26, PM: 5, DESIGNER: 5, QA: 9 },
  },
  {
    code: 'ANL_SCHEDULED_REPORTS',
    category: 'analytics',
    iconKey: 'Clock',
    title: 'Отчёты по расписанию',
    summary: 'Автоматическая отправка отчётов получателям.',
    scopeBoundaries: 'Расписание, получатели, формат файла, канал отправки, журнал доставки.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 4 },
  },
  {
    code: 'ANL_EXPORT_EXCEL',
    category: 'analytics',
    iconKey: 'Download',
    title: 'Выгрузка данных в Excel и CSV',
    summary: 'Экспорт списков и отчётов в файл.',
    scopeBoundaries:
      'Согласованные разделы, состав колонок, объём выгрузки и фоновая генерация, кодировка и форматы дат.',
    units: { BACKEND: 12, FRONTEND: 6, PM: 2, QA: 3 },
  },
  {
    code: 'ANL_BI_EXPORT',
    category: 'analytics',
    iconKey: 'LineChart',
    title: 'Выгрузка в BI-систему',
    summary: 'Поток данных во внешнюю BI или хранилище.',
    scopeBoundaries:
      'Одно направление выгрузки, состав и периодичность, инкрементальность, доступы и мониторинг.',
    units: { BACKEND: 24, FRONTEND: 4, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'ANL_FUNNEL_ANALYSIS',
    category: 'analytics',
    iconKey: 'PieChart',
    title: 'Анализ воронок',
    summary: 'Конверсия по шагам процесса.',
    scopeBoundaries:
      'Определение шагов, расчёт конверсии и потерь, сравнение периодов, срезы по источникам.',
    units: { BACKEND: 20, FRONTEND: 12, PM: 3, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'ANL_ACTIVITY_MONITOR',
    category: 'analytics',
    iconKey: 'Gauge',
    title: 'Мониторинг активности пользователей',
    summary: 'Кто и насколько активно работает в системе.',
    scopeBoundaries:
      'Метрики активности, отчёт по пользователям и подразделениям, период, права на просмотр.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 2, QA: 4 },
  },
] as const;
