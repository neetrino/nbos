import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Мобильные возможности. Одинаковый функционал в вебе и в приложении стоит одинаково — решение
 * владельца; здесь только то, что существует именно в приложении и в вебе не имеет смысла.
 */
export const MOBILE_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'MOB_PUSH_NOTIFICATIONS',
    category: 'mobile',
    iconKey: 'Bell',
    title: 'Mobile push notifications',
    summary: 'Push delivery to user devices.',
    scopeBoundaries:
      'Delivery provider, device registration, event-based and manual delivery, permissions and opt-out, and iOS and Android behavior.',
    units: { BACKEND: 16, FRONTEND: 10, PM: 2, QA: 5, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'MOB_OFFLINE_MODE',
    category: 'mobile',
    iconKey: 'Cloud',
    title: 'Mobile offline mode',
    summary: 'Local data with synchronization after reconnection.',
    scopeBoundaries:
      'Agreed offline data scope, local storage, synchronization and conflict resolution, and state indication.',
    units: { BACKEND: 20, FRONTEND: 30, PM: 4, QA: 9 },
  },
  {
    code: 'MOB_IN_APP_PURCHASE',
    category: 'mobile',
    iconKey: 'CreditCard',
    title: 'Mobile in-app purchases',
    summary: 'Purchases and subscriptions through App Store and Google Play.',
    scopeBoundaries:
      'Products and subscriptions in store portals, server-side receipt validation, purchase restoration, and store requirements.',
    units: { BACKEND: 22, FRONTEND: 16, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'MOB_DEEP_LINKS',
    category: 'mobile',
    iconKey: 'Route',
    title: 'Mobile deep links',
    summary: 'Navigation from a link to the relevant app screen.',
    scopeBoundaries:
      'URL schemes and universal links, behavior when the app is not installed, and validation on both platforms.',
    units: { BACKEND: 6, FRONTEND: 10, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'MOB_CAMERA_SCANNER',
    category: 'mobile',
    iconKey: 'QrCode',
    title: 'Mobile camera scanner',
    summary: 'QR and barcode scanning inside the app.',
    scopeBoundaries:
      'Camera permissions, code recognition, error handling, and low-light behavior.',
    units: { FRONTEND: 12, BACKEND: 4, PM: 2, QA: 4 },
  },
  {
    code: 'MOB_GEOLOCATION',
    category: 'mobile',
    iconKey: 'MapPin',
    title: 'Mobile geolocation and background tracking',
    summary: 'User location inside the app.',
    scopeBoundaries:
      'Permissions, accuracy and frequency, agreed background mode, battery use, and store justification requirements.',
    units: { BACKEND: 12, FRONTEND: 16, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'MOB_STORE_PUBLISHING',
    category: 'mobile',
    iconKey: 'Rocket',
    title: 'App Store and Google Play publishing',
    summary: 'Application release through App Store and Google Play.',
    scopeBoundaries:
      'Customer accounts, builds and signing, metadata and screenshots, review process, first release, and mandatory-update screen. Later releases are a separate service.',
    units: { PM: 4, DESIGNER: 4, QA: 4, TECHNICAL_SPECIALIST: 12 },
  },
  {
    code: 'MOB_TABLET_LAYOUT',
    category: 'mobile',
    iconKey: 'Monitor',
    title: 'Tablet layout',
    summary: 'An interface designed for larger screens.',
    scopeBoundaries: 'Agreed screens, rotation behavior, split panels, and tablet validation.',
    units: { FRONTEND: 18, PM: 2, DESIGNER: 6, QA: 4 },
  },
  {
    code: 'MOB_CRASH_AND_PRODUCT_ANALYTICS',
    category: 'mobile',
    iconKey: 'Gauge',
    title: 'Mobile crash and product analytics',
    summary: 'User crash reports and in-app events.',
    scopeBoundaries:
      'One in-app crash provider: SDK integration, build symbolication, agreed event map, and release health. Free App Store and Google Play portal reports are excluded. Fixing discovered crashes is separate work.',
    units: { FRONTEND: 8, BACKEND: 2, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'MOB_WEARABLE_COMPANION',
    category: 'mobile',
    iconKey: 'Timer',
    title: 'Smartwatch companion',
    summary: 'A limited interface for smartwatches.',
    scopeBoundaries:
      'One watch platform, agreed minimum screen set, phone synchronization, and notifications.',
    units: { BACKEND: 6, FRONTEND: 20, PM: 3, DESIGNER: 5, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
] as const;
