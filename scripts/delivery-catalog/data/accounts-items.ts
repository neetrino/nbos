import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Аккаунты, доступы и права. Простая регистрация и базовый кабинет входят в ядра тех продуктов,
 * где они предусмотрены; здесь — всё, что сверх этого.
 */
export const ACCOUNTS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'ACC_CUSTOMER_PORTAL',
    category: 'accounts',
    iconKey: 'UserCircle',
    title: 'Customer portal',
    summary: 'A portal with profile, history, and personal data.',
    scopeBoundaries:
      'Agreed portal sections, access only to personal data, operation history, and password and profile updates.',
    units: { BACKEND: 18, FRONTEND: 14, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'ACC_SOCIAL_LOGIN',
    category: 'accounts',
    iconKey: 'KeyRound',
    title: 'Social login',
    summary: 'Authentication through Google, Apple, or Facebook.',
    scopeBoundaries:
      'One provider, linking to an existing account, sign-in and sign-out, and failure handling. Each additional provider is a separate card.',
    units: { BACKEND: 10, FRONTEND: 4, PM: 1, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'ACC_SSO_ENTERPRISE',
    category: 'accounts',
    iconKey: 'Lock',
    title: 'Enterprise SSO',
    summary: 'Single sign-on through a corporate identity provider.',
    scopeBoundaries:
      'One SAML or OIDC provider, user and role mapping, sign-out, and security review.',
    units: { BACKEND: 22, FRONTEND: 6, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'ACC_TWO_FACTOR',
    category: 'accounts',
    iconKey: 'Shield',
    title: 'Two-factor authentication',
    summary: 'A second sign-in factor through an app or SMS.',
    scopeBoundaries:
      'One second-factor method, user enablement and disablement, recovery codes, and access recovery.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'ACC_ROLE_MATRIX',
    category: 'accounts',
    iconKey: 'Shield',
    title: 'Advanced roles and permissions',
    summary: 'A permission matrix for actions and data.',
    scopeBoundaries:
      'Roles, action and data-scope permissions, server-side checks, denial tests, and configuration interface.',
    units: { BACKEND: 30, FRONTEND: 14, PM: 4, DESIGNER: 3, QA: 8 },
  },
  {
    code: 'ACC_TEAM_ACCOUNTS',
    category: 'accounts',
    iconKey: 'Users',
    title: 'Team accounts',
    summary: 'One customer organization with multiple users and roles.',
    scopeBoundaries:
      'Organization and members, invitations, organization roles, and data isolation between organizations.',
    units: { BACKEND: 26, FRONTEND: 14, PM: 4, DESIGNER: 3, QA: 6 },
  },
  {
    code: 'ACC_BIOMETRIC_LOGIN',
    category: 'accounts',
    iconKey: 'Fingerprint',
    title: 'Biometric login',
    summary: 'App sign-in using fingerprint or face recognition.',
    scopeBoundaries:
      'Enablement and disablement, fallback sign-in, device-change behavior, and platform requirements.',
    units: { BACKEND: 8, FRONTEND: 10, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'ACC_AUDIT_LOG',
    category: 'accounts',
    iconKey: 'ClipboardList',
    title: 'User audit log',
    summary: 'Who changed what, with value history.',
    scopeBoundaries:
      'Agreed tracked actions, before-and-after storage, filters and search, and viewing permissions.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 2, QA: 4 },
  },
  {
    code: 'ACC_IMPERSONATION',
    category: 'accounts',
    iconKey: 'UserPlus',
    title: 'Support impersonation',
    summary: 'Viewing the interface as a user.',
    scopeBoundaries:
      'Operation permissions, clear impersonation indicator, session log, and action restrictions. Requires security review.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'ACC_GDPR_DATA_REQUESTS',
    category: 'accounts',
    iconKey: 'FileText',
    title: 'Personal data export and deletion',
    summary: 'User requests to access or delete personal data.',
    scopeBoundaries:
      'User data export, deletion while retaining mandatory records, request log, and completion deadlines.',
    units: { BACKEND: 16, FRONTEND: 6, PM: 3, QA: 4 },
  },
] as const;
