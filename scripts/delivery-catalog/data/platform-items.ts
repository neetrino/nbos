import type { CatalogSeedItem } from './catalog-seed-types';

/** Платформенные надстройки: инфраструктура, масштаб, надёжность и администрирование. */
export const PLATFORM_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'PLT_ADMIN_PANEL_EXTENDED',
    category: 'platform',
    iconKey: 'Layout',
    title: 'Extended administration panel',
    summary: 'Administrative functionality beyond the base panel.',
    scopeBoundaries:
      'Additional sections and bulk operations, section permissions, and audit log. The base administration panel is included in applicable product cores.',
    units: { BACKEND: 20, FRONTEND: 18, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'PLT_MULTI_TENANCY',
    category: 'platform',
    iconKey: 'Boxes',
    title: 'Multi-tenancy',
    summary: 'Multiple independent organizations in one system.',
    scopeBoundaries:
      'Data and settings isolation, tenant selection, permission restrictions, and impact on reporting and performance.',
    units: { BACKEND: 40, FRONTEND: 14, PM: 5, QA: 10, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'PLT_CUSTOM_DOMAINS',
    category: 'platform',
    iconKey: 'Globe',
    title: 'Customer custom domains',
    summary: 'Customer domain connection with a certificate.',
    scopeBoundaries:
      'Domain binding, certificate issuance and renewal, ownership verification, and DNS error handling.',
    units: { BACKEND: 16, FRONTEND: 6, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 5 },
  },
  {
    code: 'PLT_WHITE_LABEL',
    category: 'platform',
    iconKey: 'Palette',
    title: 'White-label branding',
    summary: 'Logo, colors, and naming tailored to the customer brand.',
    scopeBoundaries:
      'Configurable logo, colors, and copy, application in the interface and emails, and preview.',
    units: { BACKEND: 12, FRONTEND: 16, PM: 3, DESIGNER: 5, QA: 4 },
  },
  {
    code: 'PLT_PERFORMANCE_HARDENING',
    category: 'platform',
    iconKey: 'Zap',
    title: 'Performance hardening',
    summary: 'Product optimization for high data volume and traffic.',
    scopeBoundaries:
      'Agreed targets, profiling, indexes and caching, and before-and-after measurements. Architecture replacement is excluded.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'PLT_CACHING_LAYER',
    category: 'platform',
    iconKey: 'Server',
    title: 'Caching layer',
    summary: 'Caching for expensive queries and pages.',
    scopeBoundaries:
      'Cache targets and duration, invalidation after changes, and behavior when the cache is unavailable.',
    units: { BACKEND: 18, FRONTEND: 4, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'PLT_BACKUP_RESTORE',
    category: 'platform',
    iconKey: 'HardDrive',
    title: 'Backup and restore',
    summary: 'Regular backups with tested restoration.',
    scopeBoundaries:
      'Backup schedule and retention, restoration testing in a separate environment, and customer instructions.',
    units: { BACKEND: 10, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 8 },
  },
  {
    code: 'PLT_MONITORING_ALERTS',
    category: 'platform',
    iconKey: 'Gauge',
    title: 'Monitoring and alerts',
    summary: 'Availability and error monitoring.',
    scopeBoundaries:
      'Metrics and alert thresholds, on-call notification channel, error collection, and status dashboard.',
    units: { BACKEND: 12, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 8 },
  },
  {
    code: 'PLT_CUSTOM_DEPLOYMENT',
    category: 'platform',
    iconKey: 'Rocket',
    title: 'Custom deployment',
    summary: 'Additional environments or customer infrastructure.',
    scopeBoundaries:
      'Additional environments beyond the base, reproducible steps, availability checks, and handoff to the customer team.',
    units: { BACKEND: 10, PM: 3, QA: 3, TECHNICAL_SPECIALIST: 12 },
  },
  {
    code: 'PLT_ON_PREMISE_SETUP',
    category: 'platform',
    iconKey: 'Server',
    title: 'Customer server installation',
    summary: 'Deployment in customer-managed infrastructure.',
    scopeBoundaries:
      'Server requirements, installation and configuration, updates, and administrator instructions. Ongoing administration is excluded.',
    units: { BACKEND: 12, PM: 4, QA: 4, TECHNICAL_SPECIALIST: 16 },
  },
  {
    code: 'PLT_FEATURE_FLAGS',
    category: 'platform',
    iconKey: 'SlidersHorizontal',
    title: 'Feature flags',
    summary: 'Feature enablement and disablement without a release.',
    scopeBoundaries: 'Flag directory, scope, change auditing, and safe defaults.',
    units: { BACKEND: 14, FRONTEND: 8, PM: 2, QA: 4 },
  },
  {
    code: 'PLT_ACCESSIBILITY_PASS',
    category: 'platform',
    iconKey: 'LifeBuoy',
    title: 'Interface accessibility',
    summary: 'Alignment of the interface with accessibility requirements.',
    scopeBoundaries:
      'Agreed compliance level and screen set, keyboard navigation, contrast, semantics and ARIA, and screen-reader testing.',
    units: { FRONTEND: 18, PM: 2, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'PLT_SECURITY_HARDENING',
    category: 'platform',
    iconKey: 'Shield',
    title: 'Security hardening',
    summary: 'Product vulnerability review and remediation.',
    scopeBoundaries:
      'Agreed review surfaces, findings report and remediation of high and critical vulnerabilities, headers and limits, and retesting. Medium and low findings, architecture redesign, and certification are excluded.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 6 },
  },
] as const;
