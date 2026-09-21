import { codeKindProfile, growPresets, SYSTEM_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const REGISTRATION_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'registration-system-code',
  productType: 'REGISTRATION_SYSTEM',
  description: 'Ядро системы регистрации: формы, статусы и допуск. Один вид — одно ядро.',
  coreItems: [
    { label: 'Форма регистрации' },
    { label: 'Статусы заявок' },
    { label: 'Проверка и допуск' },
    { label: 'Админка регистраций' },
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
    'Ядро операционки мероприятия: участники, программа и роли. Сайт события — отдельный вид.',
  coreItems: [
    { label: 'Участники и роли' },
    { label: 'Программа и зоны' },
    { label: 'Операционный контур' },
    { label: 'Админка события' },
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
  description: 'Ядро СЭД: жизненный цикл документов, версии и маршруты. Один вид — одно ядро.',
  coreItems: [
    { label: 'Карточка документа' },
    { label: 'Версии' },
    { label: 'Маршрут согласования' },
    { label: 'Права и архив' },
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
  description: 'Ядро склада и учёта: остатки, движения и история. Один вид — одно ядро.',
  coreItems: [
    { label: 'Номенклатура' },
    { label: 'Остатки' },
    { label: 'Движения' },
    { label: 'История и отчёты' },
  ],
  units: { BACKEND: 64, FRONTEND: 48, PM: 14, DESIGNER: 12, QA: 12, TECHNICAL_SPECIALIST: 6 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'LOG_WAREHOUSE_OPERATIONS', 'SHOP_STOCK_MANAGEMENT', 'ANL_EXPORT_EXCEL'],
    ['CNT_MULTILINGUAL', 'ANL_DASHBOARD', 'FIN_INVOICES', 'MSG_SMS_NOTIFICATIONS'],
    ['INT_1C', 'INT_ERP_GENERIC', 'ACC_ROLE_MATRIX', 'INT_PUBLIC_API'],
  ),
});
