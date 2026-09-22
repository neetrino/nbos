import { codeKindProfile, growPresets, SYSTEM_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

export const MARKETPLACE_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'marketplace-code',
  productType: 'MARKETPLACE',
  description: 'Marketplace core: sellers, buyers, listings, and orders. One kind is one core.',
  coreItems: [
    { label: 'Seller and buyer cabinets' },
    { label: 'Listings and moderation' },
    { label: 'Orders between parties' },
    { label: 'Platform commission' },
    { label: 'Platform admin' },
  ],
  units: { BACKEND: 90, FRONTEND: 75, PM: 20, DESIGNER: 24, QA: 18, TECHNICAL_SPECIALIST: 8 },
  presets: growPresets(
    [
      ...SYSTEM_LAUNCH,
      'MKT_SELLER_CABINET',
      'MKT_COMMISSIONS',
      'SHOP_CATALOG_FILTERS',
      'MSG_SMS_NOTIFICATIONS',
    ],
    ['MKT_LISTING_MODERATION', 'LOY_DISCOUNT_COUPONS', 'LOG_DELIVERY_ZONES', 'CNT_MULTILINGUAL'],
    ['INT_PUBLIC_API', 'ANL_DASHBOARD', 'ACC_ROLE_MATRIX', 'PLT_SECURITY_HARDENING'],
  ),
});

export const B2B_COMMERCE_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'b2b-commerce-portal-code',
  productType: 'B2B_COMMERCE_PORTAL',
  description:
    'B2B portal core: personal terms, orders, and dealer documents. One kind is one core.',
  coreItems: [
    { label: 'Closed catalog' },
    { label: 'Personal prices' },
    { label: 'Repeat orders' },
    { label: 'Dealer cabinet' },
    { label: 'Order documents' },
  ],
  units: { BACKEND: 70, FRONTEND: 58, PM: 16, DESIGNER: 18, QA: 14, TECHNICAL_SPECIALIST: 6 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'SHOP_B2B_PRICING', 'ACC_CUSTOMER_PORTAL', 'FIN_INVOICES'],
    ['CNT_MULTILINGUAL', 'CNT_DOCUMENT_LIBRARY', 'ANL_DASHBOARD', 'MSG_SMS_NOTIFICATIONS'],
    ['INT_1C', 'INT_PUBLIC_API', 'ACC_ROLE_MATRIX', 'ACC_SSO_ENTERPRISE'],
  ),
});

export const BOOKING_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'booking-system-code',
  productType: 'BOOKING_SYSTEM',
  description:
    'Booking-system core: slots, resources, reservations, and confirmation. One kind is one core.',
  coreItems: [
    { label: 'Resources and schedule' },
    { label: 'Slots and reservations' },
    { label: 'Reschedule and cancel' },
    { label: 'Administrator cabinet' },
    { label: 'Booking notification' },
  ],
  units: { BACKEND: 55, FRONTEND: 48, PM: 14, DESIGNER: 16, QA: 12, TECHNICAL_SPECIALIST: 5 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'BOOK_RESOURCE_SCHEDULE', 'BOOK_CALENDAR_VIEW', 'BOOK_REMINDERS'],
    ['BOOK_RECURRING', 'BOOK_STAFF_WORKLOAD', 'CNT_MULTILINGUAL', 'MSG_SMS_NOTIFICATIONS'],
    ['BOOK_PREPAYMENT', 'BOOK_EXTERNAL_CALENDAR_SYNC', 'ANL_DASHBOARD', 'INT_PUBLIC_API'],
  ),
});

export const TICKETING_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'ticketing-system-code',
  productType: 'TICKETING_SYSTEM',
  description: 'Ticketing-system core: ticket types, sales, and check-in. One kind is one core.',
  coreItems: [
    { label: 'Ticket types' },
    { label: 'Sale and payment' },
    { label: 'QR and check-in' },
    { label: 'Cashier cabinet' },
  ],
  units: { BACKEND: 48, FRONTEND: 42, PM: 12, DESIGNER: 14, QA: 10, TECHNICAL_SPECIALIST: 5 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'TKT_ISSUE', 'TKT_QR_CHECKIN', 'PAY_AMERIABANK'],
    ['CNT_MULTILINGUAL', 'MSG_SMS_NOTIFICATIONS', 'ANL_DASHBOARD', 'LOY_DISCOUNT_COUPONS'],
    ['BOOK_RESOURCE_SCHEDULE', 'INT_PUBLIC_API', 'ACC_ROLE_MATRIX', 'PLT_SECURITY_HARDENING'],
  ),
});

export const POS_PROFILE: ProfileSeedKind = codeKindProfile({
  keyStem: 'pos-code',
  productType: 'POS',
  description:
    'POS core: in-store sale, receipt, and shift. One kind is one core; Desktop extras are separate.',
  coreItems: [
    { label: 'Sale screen' },
    { label: 'Receipt' },
    { label: 'Cash shift' },
    { label: 'In-store catalog' },
  ],
  units: { BACKEND: 50, FRONTEND: 52, PM: 12, DESIGNER: 14, QA: 12, TECHNICAL_SPECIALIST: 8 },
  presets: growPresets(
    [...SYSTEM_LAUNCH, 'POS_RECEIPT', 'POS_CASH_SHIFT', 'POS_BARCODE'],
    ['DSK_HARDWARE_PERIPHERALS', 'SHOP_STOCK_MANAGEMENT', 'LOY_DISCOUNT_COUPONS'],
    ['DSK_OFFLINE_POS', 'ANL_DASHBOARD', 'INT_1C', 'ACC_ROLE_MATRIX'],
  ),
});
