import type { CatalogSeedItem } from './catalog-seed-types';

/** Персонал внутри продукта клиента: сотрудники, учёт времени, отпуска, обучение. */
export const HR_OPS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'HR_EMPLOYEE_DIRECTORY',
    category: 'hr_ops',
    iconKey: 'Users',
    title: 'Справочник сотрудников',
    summary: 'Карточки сотрудников с должностями и структурой.',
    scopeBoundaries:
      'Карточка сотрудника, подразделения и должности, статусы работы, поиск, права на персональные данные.',
    units: { BACKEND: 18, FRONTEND: 12, PM: 3, DESIGNER: 3, QA: 4 },
  },
  {
    code: 'HR_TIME_TRACKING',
    category: 'hr_ops',
    iconKey: 'Timer',
    title: 'Учёт рабочего времени',
    summary: 'Табель по сменам и отметкам.',
    scopeBoundaries:
      'Отметки прихода и ухода, табель за период, сверхурочные, корректировки руководителем, отчёт.',
    units: { BACKEND: 22, FRONTEND: 12, PM: 3, QA: 6 },
  },
  {
    code: 'HR_SHIFT_PLANNING',
    category: 'hr_ops',
    iconKey: 'CalendarClock',
    title: 'Планирование смен',
    summary: 'График смен по сотрудникам и точкам.',
    scopeBoundaries:
      'Шаблоны смен, назначение сотрудников, конфликты и переработки, публикация графика, обмен сменами.',
    units: { BACKEND: 24, FRONTEND: 16, PM: 4, DESIGNER: 4, QA: 6 },
  },
  {
    code: 'HR_LEAVE_REQUESTS',
    category: 'hr_ops',
    iconKey: 'CalendarCheck',
    title: 'Отпуска и заявки на отсутствие',
    summary: 'Заявки с согласованием и остатком дней.',
    scopeBoundaries:
      'Типы отсутствий, остаток дней, маршрут согласования, календарь отсутствий, уведомления.',
    units: { BACKEND: 20, FRONTEND: 12, PM: 3, QA: 5 },
  },
  {
    code: 'HR_ONBOARDING_CHECKLISTS',
    category: 'hr_ops',
    iconKey: 'ListChecks',
    title: 'Чек-листы адаптации',
    summary: 'Шаги приёма и увольнения сотрудника.',
    scopeBoundaries:
      'Шаблоны шагов, ответственные и сроки, прогресс по сотруднику, напоминания. Документооборот не входит.',
    units: { BACKEND: 16, FRONTEND: 10, PM: 3, QA: 4 },
  },
  {
    code: 'HR_PERFORMANCE_REVIEW',
    category: 'hr_ops',
    iconKey: 'Star',
    title: 'Оценка сотрудников',
    summary: 'Периодическая оценка по критериям.',
    scopeBoundaries:
      'Критерии и периоды, самооценка и оценка руководителя, итоговый результат, история, права на просмотр.',
    units: { BACKEND: 20, FRONTEND: 12, PM: 4, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'HR_TRAINING_COURSES',
    category: 'hr_ops',
    iconKey: 'GraduationCap',
    title: 'Обучение и тесты',
    summary: 'Курсы для сотрудников с проверкой знаний.',
    scopeBoundaries:
      'Материалы курса, тесты и проходной балл, прогресс сотрудника, повторное прохождение, отчёт.',
    units: { BACKEND: 24, FRONTEND: 18, PM: 4, DESIGNER: 5, QA: 6 },
  },
  {
    code: 'HR_DOCUMENT_STORAGE',
    category: 'hr_ops',
    iconKey: 'FileText',
    title: 'Документы сотрудников',
    summary: 'Хранение кадровых документов со сроками.',
    scopeBoundaries:
      'Типы документов, сроки действия и напоминания, ограниченный доступ, журнал просмотров.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 3, QA: 4 },
  },
] as const;
