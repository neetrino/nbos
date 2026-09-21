import { codeKindProfile, growPresets, SYSTEM_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const KNOWLEDGE_BASE_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'knowledge-base-code',
  productType: 'KNOWLEDGE_BASE',
  description: 'Ядро базы знаний как продукта: статьи, поиск и доступ. Один вид — одно ядро.',
  coreItems: [
    { label: 'Разделы и статьи' },
    { label: 'Поиск' },
    { label: 'Права на чтение' },
    { label: 'Редактор' },
  ],
  units: { BACKEND: 32, FRONTEND: 34, PM: 9, DESIGNER: 12, QA: 8, TECHNICAL_SPECIALIST: 3 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'CNT_FAQ_KNOWLEDGE_BASE', 'CNT_DOCUMENT_LIBRARY', 'CNT_MEDIA_GALLERY'],
    ['CNT_MULTILINGUAL', 'AI_SEMANTIC_SEARCH', 'CNT_COMMENTS_MODERATION', 'ANL_DASHBOARD'],
    ['ACC_ROLE_MATRIX', 'INT_PUBLIC_API', 'PLT_SECURITY_HARDENING', 'AI_CONTENT_GENERATION'],
  ),
});

export const INDUSTRY_OPS_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'industry-operations-system-code',
  productType: 'INDUSTRY_OPERATIONS_SYSTEM',
  description:
    'Ядро отраслевой операционки: узкий процесс клиники, цеха или сервиса. Не путать с BOS.',
  coreItems: [
    { label: 'Отраслевые сущности' },
    { label: 'Операционный контур' },
    { label: 'Роли площадки' },
    { label: 'Базовые отчёты' },
  ],
  units: { BACKEND: 95, FRONTEND: 72, PM: 20, DESIGNER: 20, QA: 18, TECHNICAL_SPECIALIST: 8 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'CRM_TASKS', 'ANL_DASHBOARD', 'CNT_DOCUMENT_LIBRARY'],
    ['CNT_MULTILINGUAL', 'BOOK_RESOURCE_SCHEDULE', 'LOG_WAREHOUSE_OPERATIONS', 'ACC_ROLE_MATRIX'],
    ['INT_PUBLIC_API', 'PLT_SECURITY_HARDENING', 'PLT_BACKUP_RESTORE', 'ANL_CUSTOM_REPORTS'],
  ),
});

export const BOS_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'bos-code',
  productType: 'BOS',
  description: 'Ядро Business Operation System: CRM, задачи, коммуникации и учёт в одном продукте.',
  coreItems: [
    { label: 'Клиенты и сделки' },
    { label: 'Задачи команды' },
    { label: 'Внутренние коммуникации' },
    { label: 'Склад и учёт' },
    { label: 'Единый кабинет компании' },
  ],
  units: { BACKEND: 120, FRONTEND: 95, PM: 24, DESIGNER: 26, QA: 22, TECHNICAL_SPECIALIST: 10 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'CRM_PIPELINE', 'CRM_TASKS', 'MSG_WHATSAPP_NOTIFICATIONS'],
    [
      'LOG_WAREHOUSE_OPERATIONS',
      'FIN_INVOICES',
      'CNT_MULTILINGUAL',
      'ANL_DASHBOARD',
      'ACC_TEAM_ACCOUNTS',
    ],
    [
      'ACC_ROLE_MATRIX',
      'INT_PUBLIC_API',
      'PLT_MULTI_TENANCY',
      'PLT_SECURITY_HARDENING',
      'AI_LEAD_SCORING',
    ],
  ),
});
