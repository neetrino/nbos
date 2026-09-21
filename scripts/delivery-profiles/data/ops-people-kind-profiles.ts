import { codeKindProfile, growPresets, SYSTEM_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const HRM_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'hrm-code',
  productType: 'HRM',
  description: 'Ядро HRM: сотрудники, кадры и кадровые процессы. Один вид — одно ядро.',
  coreItems: [
    { label: 'Карточка сотрудника' },
    { label: 'Оргструктура' },
    { label: 'Статусы занятости' },
    { label: 'Роли кадровика' },
  ],
  units: { BACKEND: 72, FRONTEND: 58, PM: 16, DESIGNER: 16, QA: 14, TECHNICAL_SPECIALIST: 6 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'HR_EMPLOYEE_DIRECTORY', 'HR_DOCUMENT_STORAGE', 'ANL_EXPORT_EXCEL'],
    ['HR_LEAVE_REQUESTS', 'HR_TIME_TRACKING', 'HR_ONBOARDING_CHECKLISTS', 'CNT_MULTILINGUAL'],
    ['HR_PERFORMANCE_REVIEW', 'HR_SHIFT_PLANNING', 'ACC_ROLE_MATRIX', 'INT_PUBLIC_API'],
  ),
});

export const LMS_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'lms-code',
  productType: 'LMS',
  description: 'Ядро LMS: курсы, уроки, запись и прогресс. Один вид — одно ядро.',
  coreItems: [
    { label: 'Курсы и программы' },
    { label: 'Уроки и материалы' },
    { label: 'Запись слушателя' },
    { label: 'Прогресс обучения' },
  ],
  units: { BACKEND: 60, FRONTEND: 55, PM: 14, DESIGNER: 18, QA: 12, TECHNICAL_SPECIALIST: 5 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'LMS_COURSES', 'LMS_LESSONS', 'LMS_ENROLLMENTS'],
    ['LMS_ASSESSMENTS', 'CNT_MULTILINGUAL', 'CNT_VIDEO_HOSTING', 'CNT_MEDIA_GALLERY'],
    ['LMS_CERTIFICATES', 'ANL_DASHBOARD', 'AI_CONTENT_GENERATION', 'INT_PUBLIC_API'],
  ),
});

export const TASK_MANAGEMENT_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'task-management-system-code',
  productType: 'TASK_MANAGEMENT_SYSTEM',
  description: 'Ядро системы задач: постановка, статусы и контроль. Один вид — одно ядро.',
  coreItems: [
    { label: 'Задачи и исполнители' },
    { label: 'Статусы и сроки' },
    { label: 'Комментарии' },
    { label: 'Список и фильтры' },
  ],
  units: { BACKEND: 42, FRONTEND: 40, PM: 12, DESIGNER: 14, QA: 10, TECHNICAL_SPECIALIST: 4 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'CRM_TASKS', 'CRM_TASK_BOARD'],
    ['CNT_MULTILINGUAL', 'ANL_DASHBOARD', 'ACC_TEAM_ACCOUNTS', 'MSG_SMS_NOTIFICATIONS'],
    ['CRM_WORKFLOW_AUTOMATION', 'ACC_ROLE_MATRIX', 'INT_PUBLIC_API', 'PLT_BACKUP_RESTORE'],
  ),
});

export const HELP_DESK_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'help-desk-system-code',
  productType: 'HELP_DESK_SYSTEM',
  description: 'Ядро help desk: заявки, очереди и переписка. Один вид — одно ядро.',
  coreItems: [
    { label: 'Заявки и очереди' },
    { label: 'Ответственные и статусы' },
    { label: 'Переписка по заявке' },
    { label: 'История решения' },
  ],
  units: { BACKEND: 50, FRONTEND: 44, PM: 13, DESIGNER: 14, QA: 11, TECHNICAL_SPECIALIST: 5 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'CRM_SUPPORT_TICKETS', 'ANL_EXPORT_EXCEL'],
    ['CNT_FAQ_KNOWLEDGE_BASE', 'CNT_MULTILINGUAL', 'MSG_WHATSAPP_NOTIFICATIONS', 'ANL_DASHBOARD'],
    ['AI_SUPPORT_CHATBOT', 'ACC_ROLE_MATRIX', 'INT_PUBLIC_API', 'PLT_MONITORING_ALERTS'],
  ),
});
