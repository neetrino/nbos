import type { CatalogSeedItem } from './catalog-seed-types';

/** Персонал внутри продукта клиента: сотрудники, учёт времени, отпуска, обучение. */
export const HR_OPS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'HR_EMPLOYEE_DIRECTORY',
    category: 'hr_ops',
    iconKey: 'Users',
    title: 'Employee directory',
    summary: 'Employee records with positions and organization structure.',
    scopeBoundaries:
      'Employee record, departments and positions, employment statuses, search, and personal-data permissions.',
    units: { BACKEND: 18, FRONTEND: 12, PM: 3, DESIGNER: 3, QA: 4 },
  },
  {
    code: 'HR_TIME_TRACKING',
    category: 'hr_ops',
    iconKey: 'Timer',
    title: 'Time tracking',
    summary: 'Timesheets based on shifts and clock events.',
    scopeBoundaries:
      'Clock-in and clock-out, period timesheet, overtime, manager adjustments, and reporting.',
    units: { BACKEND: 22, FRONTEND: 12, PM: 3, QA: 6 },
  },
  {
    code: 'HR_SHIFT_PLANNING',
    category: 'hr_ops',
    iconKey: 'CalendarClock',
    title: 'Shift planning',
    summary: 'Shift schedules by employee and location.',
    scopeBoundaries:
      'Shift templates, employee assignment, conflicts and overtime, schedule publication, and shift swaps.',
    units: { BACKEND: 24, FRONTEND: 16, PM: 4, DESIGNER: 4, QA: 6 },
  },
  {
    code: 'HR_LEAVE_REQUESTS',
    category: 'hr_ops',
    iconKey: 'CalendarCheck',
    title: 'Leave and absence requests',
    summary: 'Approval-based requests with remaining-day balances.',
    scopeBoundaries:
      'Absence types, remaining balance, approval route, absence calendar, and notifications.',
    units: { BACKEND: 20, FRONTEND: 12, PM: 3, QA: 5 },
  },
  {
    code: 'HR_ONBOARDING_CHECKLISTS',
    category: 'hr_ops',
    iconKey: 'ListChecks',
    title: 'Employee onboarding checklists',
    summary: 'Steps for employee onboarding and offboarding.',
    scopeBoundaries:
      'Step templates, owners and deadlines, employee progress, and reminders. Document workflows are excluded.',
    units: { BACKEND: 16, FRONTEND: 10, PM: 3, QA: 4 },
  },
  {
    code: 'HR_PERFORMANCE_REVIEW',
    category: 'hr_ops',
    iconKey: 'Star',
    title: 'Employee performance reviews',
    summary: 'Periodic evaluation against defined criteria.',
    scopeBoundaries:
      'Criteria and periods, self and manager reviews, final result, history, and viewing permissions.',
    units: { BACKEND: 20, FRONTEND: 12, PM: 4, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'HR_TRAINING_COURSES',
    category: 'hr_ops',
    iconKey: 'GraduationCap',
    title: 'Employee training and tests',
    summary: 'Employee courses with knowledge assessment.',
    scopeBoundaries:
      'Course materials, tests and passing score, employee progress, retakes, and reporting.',
    units: { BACKEND: 24, FRONTEND: 18, PM: 4, DESIGNER: 5, QA: 6 },
  },
  {
    code: 'HR_DOCUMENT_STORAGE',
    category: 'hr_ops',
    iconKey: 'FileText',
    title: 'Employee document storage',
    summary: 'HR document storage with expiration dates.',
    scopeBoundaries: 'Document types, expiration and reminders, restricted access, and view log.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 3, QA: 4 },
  },
] as const;
