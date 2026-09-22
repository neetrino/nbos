import { codeKindProfile, growPresets, SYSTEM_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const KNOWLEDGE_BASE_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'knowledge-base-code',
  productType: 'KNOWLEDGE_BASE',
  description: 'Knowledge-base product core: articles, search, and access. One kind is one core.',
  coreItems: [
    { label: 'Sections and articles' },
    { label: 'Search' },
    { label: 'Read permissions' },
    { label: 'Editor' },
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
    'Industry-operations core: a narrow clinic, shop-floor, or service process. Not a BOS.',
  coreItems: [
    { label: 'Industry entities' },
    { label: 'Operations loop' },
    { label: 'Site roles' },
    { label: 'Basic reports' },
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
  description:
    'Business Operation System core: CRM, tasks, communications, and accounting in one product.',
  coreItems: [
    { label: 'Customers and deals' },
    { label: 'Team tasks' },
    { label: 'Internal communications' },
    { label: 'Stock and accounting' },
    { label: 'Single company cabinet' },
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
