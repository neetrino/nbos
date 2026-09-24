import { codeKindProfile, growPresets, SYSTEM_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const REGISTRATION_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'registration-system-code',
  productType: 'REGISTRATION_SYSTEM',
  description: 'Registration-system core: forms, statuses, and admission. One kind is one core.',
  coreItems: [
    { label: 'Registration form' },
    { label: 'Application statuses' },
    { label: 'Review and admission' },
    { label: 'Registration admin' },
  ],
  units: { BACKEND: 38, FRONTEND: 36, PM: 10, DESIGNER: 12, QA: 9, TECHNICAL_SPECIALIST: 4 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'CNT_FORMS_BUILDER', 'CRM_LEAD_CAPTURE', 'TKT_QR_CHECKIN'],
    ['CNT_MULTILINGUAL', 'MSG_SMS_NOTIFICATIONS', 'CNT_PRINT_TEMPLATES', 'ANL_EXPORT_EXCEL'],
    ['BOOK_RESOURCE_SCHEDULE', 'ACC_ROLE_MATRIX', 'INT_PUBLIC_API', 'ANL_DASHBOARD'],
  ),
});

export const EVENT_MANAGEMENT_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'event-management-system-code',
  productType: 'EVENT_MANAGEMENT_SYSTEM',
  description:
    'Event-operations core: participants, program, and roles. The event website is a separate kind.',
  coreItems: [
    { label: 'Participants and roles' },
    { label: 'Program and zones' },
    { label: 'Operations loop' },
    { label: 'Event admin' },
  ],
  units: { BACKEND: 62, FRONTEND: 52, PM: 15, DESIGNER: 16, QA: 12, TECHNICAL_SPECIALIST: 6 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'BOOK_RESOURCE_SCHEDULE', 'CRM_TASKS'],
    ['TKT_ISSUE', 'CNT_MULTILINGUAL', 'MSG_SMS_NOTIFICATIONS', 'ANL_DASHBOARD'],
    ['TKT_QR_CHECKIN', 'ACC_ROLE_MATRIX', 'INT_PUBLIC_API', 'PLT_SECURITY_HARDENING'],
  ),
});

export const DOCUMENT_MANAGEMENT_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'document-management-system-code',
  productType: 'DOCUMENT_MANAGEMENT_SYSTEM',
  description:
    'Document-management core: document lifecycle, versions, and routes. One kind is one core.',
  coreItems: [
    { label: 'Document card' },
    { label: 'Versions' },
    { label: 'Approval route' },
    { label: 'Permissions and archive' },
  ],
  units: { BACKEND: 68, FRONTEND: 52, PM: 16, DESIGNER: 14, QA: 14, TECHNICAL_SPECIALIST: 6 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'CNT_DOCUMENT_LIBRARY', 'CRM_CONTRACTS', 'ACC_AUDIT_LOG'],
    ['CRM_ESIGNATURE', 'CNT_MULTILINGUAL', 'CRM_WORKFLOW_AUTOMATION', 'ANL_DASHBOARD'],
    ['ACC_ROLE_MATRIX', 'INT_PUBLIC_API', 'PLT_BACKUP_RESTORE', 'PLT_SECURITY_HARDENING'],
  ),
});

export const INVENTORY_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'inventory-system-code',
  productType: 'INVENTORY_SYSTEM',
  description: 'Inventory core: stock, movements, and history. One kind is one core.',
  coreItems: [
    { label: 'Items' },
    { label: 'Stock' },
    { label: 'Movements' },
    { label: 'History and reports' },
  ],
  units: { BACKEND: 64, FRONTEND: 48, PM: 14, DESIGNER: 12, QA: 12, TECHNICAL_SPECIALIST: 6 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'LOG_WAREHOUSE_OPERATIONS', 'SHOP_STOCK_MANAGEMENT', 'ANL_EXPORT_EXCEL'],
    ['CNT_MULTILINGUAL', 'ANL_DASHBOARD', 'FIN_INVOICES', 'MSG_SMS_NOTIFICATIONS'],
    ['INT_1C', 'INT_ERP_GENERIC', 'ACC_ROLE_MATRIX', 'INT_PUBLIC_API'],
  ),
});
