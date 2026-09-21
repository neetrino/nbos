import { codeKindProfile, growPresets, SYSTEM_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const CUSTOMER_PORTAL_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'customer-portal-code',
  productType: 'CUSTOMER_PORTAL',
  description:
    'Ядро клиентского кабинета как самостоятельного продукта. Кабинет магазина остаётся extra.',
  coreItems: [
    { label: 'Профиль клиента' },
    { label: 'Заказы или заявки' },
    { label: 'Документы клиента' },
    { label: 'Обращения' },
  ],
  units: { BACKEND: 44, FRONTEND: 42, PM: 12, DESIGNER: 16, QA: 10, TECHNICAL_SPECIALIST: 4 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'ACC_CUSTOMER_PORTAL', 'CNT_DOCUMENT_LIBRARY'],
    ['CNT_MULTILINGUAL', 'CRM_SUPPORT_TICKETS', 'ANL_DASHBOARD', 'MSG_SMS_NOTIFICATIONS'],
    ['ACC_SSO_ENTERPRISE', 'INT_PUBLIC_API', 'ACC_ROLE_MATRIX', 'PLT_CUSTOM_DOMAINS'],
  ),
});

export const PARTNER_PORTAL_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'partner-portal-code',
  productType: 'PARTNER_PORTAL',
  description:
    'Ядро партнёрского кабинета: материалы, условия и совместные процессы. Один вид — одно ядро.',
  coreItems: [
    { label: 'Кабинет партнёра' },
    { label: 'Материалы и условия' },
    { label: 'Заявки или лиды' },
    { label: 'Документы' },
  ],
  units: { BACKEND: 46, FRONTEND: 42, PM: 12, DESIGNER: 16, QA: 10, TECHNICAL_SPECIALIST: 4 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'ACC_CUSTOMER_PORTAL', 'CNT_DOCUMENT_LIBRARY', 'CRM_LEAD_CAPTURE'],
    ['CNT_MULTILINGUAL', 'SHOP_B2B_PRICING', 'ANL_DASHBOARD', 'MSG_SMS_NOTIFICATIONS'],
    ['ACC_SSO_ENTERPRISE', 'INT_PUBLIC_API', 'ACC_ROLE_MATRIX', 'FIN_INVOICES'],
  ),
});
