import { codeKindProfile, growPresets, SYSTEM_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const CUSTOMER_PORTAL_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'customer-portal-code',
  productType: 'CUSTOMER_PORTAL',
  description: 'Standalone customer-cabinet core. A shop cabinet stays an extra.',
  coreItems: [
    { label: 'Customer profile' },
    { label: 'Orders or requests' },
    { label: 'Customer documents' },
    { label: 'Support requests' },
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
    'Partner-cabinet core: materials, terms, and shared processes. One kind is one core.',
  coreItems: [
    { label: 'Partner cabinet' },
    { label: 'Materials and terms' },
    { label: 'Requests or leads' },
    { label: 'Documents' },
  ],
  units: { BACKEND: 46, FRONTEND: 42, PM: 12, DESIGNER: 16, QA: 10, TECHNICAL_SPECIALIST: 4 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'ACC_CUSTOMER_PORTAL', 'CNT_DOCUMENT_LIBRARY', 'CRM_LEAD_CAPTURE'],
    ['CNT_MULTILINGUAL', 'SHOP_B2B_PRICING', 'ANL_DASHBOARD', 'MSG_SMS_NOTIFICATIONS'],
    ['ACC_SSO_ENTERPRISE', 'INT_PUBLIC_API', 'ACC_ROLE_MATRIX', 'FIN_INVOICES'],
  ),
});
