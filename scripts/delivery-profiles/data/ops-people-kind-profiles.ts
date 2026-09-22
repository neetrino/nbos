import { codeKindProfile, growPresets, SYSTEM_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const HRM_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'hrm-code',
  productType: 'HRM',
  description: 'HRM core: employees, HR records, and HR processes. One kind is one core.',
  coreItems: [
    { label: 'Employee card' },
    { label: 'Org structure' },
    { label: 'Employment statuses' },
    { label: 'HR roles' },
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
  description: 'LMS core: courses, lessons, enrollment, and progress. One kind is one core.',
  coreItems: [
    { label: 'Courses and programs' },
    { label: 'Lessons and materials' },
    { label: 'Learner enrollment' },
    { label: 'Learning progress' },
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
  description: 'Task-system core: assignment, statuses, and control. One kind is one core.',
  coreItems: [
    { label: 'Tasks and assignees' },
    { label: 'Statuses and due dates' },
    { label: 'Comments' },
    { label: 'List and filters' },
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
  description: 'Help-desk core: tickets, queues, and conversation. One kind is one core.',
  coreItems: [
    { label: 'Tickets and queues' },
    { label: 'Owners and statuses' },
    { label: 'Ticket conversation' },
    { label: 'Resolution history' },
  ],
  units: { BACKEND: 50, FRONTEND: 44, PM: 13, DESIGNER: 14, QA: 11, TECHNICAL_SPECIALIST: 5 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'CRM_SUPPORT_TICKETS', 'ANL_EXPORT_EXCEL'],
    ['CNT_FAQ_KNOWLEDGE_BASE', 'CNT_MULTILINGUAL', 'MSG_WHATSAPP_NOTIFICATIONS', 'ANL_DASHBOARD'],
    ['AI_SUPPORT_CHATBOT', 'ACC_ROLE_MATRIX', 'INT_PUBLIC_API', 'PLT_MONITORING_ALERTS'],
  ),
});
