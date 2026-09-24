import { codeKindProfile, growPresets, SITE_LAUNCH } from './code-kind-profile';
import type { ProfileSeedKind } from './profile-seed-types';

/** Draft-only structures. The Owner must configure role units and sale prices before publication. */
export const NEW_SITE_KIND_PROFILES: readonly ProfileSeedKind[] = [
  codeKindProfile({
    keyStem: 'real-estate-website-code',
    productType: 'REAL_ESTATE_WEBSITE',
    description:
      'Real estate website core: property listings, property details, agents, and inquiries. Transactions and booking are extras.',
    coreItems: [
      { label: 'Property listings and categories' },
      { label: 'Property detail and attributes' },
      { label: 'Property search and filters' },
      { label: 'Agent contacts and inquiry form' },
      { label: 'Property content admin' },
      { label: 'Responsive layout and basic SEO' },
    ],
    units: {},
    presets: growPresets(
      [...SITE_LAUNCH, 'CRM_LEAD_CAPTURE', 'MSG_EMAIL_NOTIFICATIONS'],
      ['CNT_MULTILINGUAL', 'INT_MAPS', 'CNT_MEDIA_GALLERY'],
      ['BOOK_RESOURCE_SCHEDULE', 'ANL_DASHBOARD', 'INT_EXTERNAL_CRM'],
    ),
  }),
  codeKindProfile({
    keyStem: 'service-website-code',
    productType: 'SERVICE_WEBSITE',
    description:
      'Service website core: services, detail pages, a request form, and content management. Scheduling and payments are extras.',
    coreItems: [
      { label: 'Service categories and list' },
      { label: 'Service detail pages' },
      { label: 'Request and contact form' },
      { label: 'Service content admin' },
      { label: 'Responsive layout and basic SEO' },
    ],
    units: {},
    presets: growPresets(
      [...SITE_LAUNCH, 'CRM_LEAD_CAPTURE', 'MSG_EMAIL_NOTIFICATIONS'],
      ['BOOK_RESOURCE_SCHEDULE', 'CNT_MULTILINGUAL', 'CNT_MEDIA_GALLERY'],
      ['BOOK_PREPAYMENT', 'ANL_DASHBOARD', 'INT_EXTERNAL_CRM'],
    ),
  }),
  codeKindProfile({
    keyStem: 'travel-website-code',
    productType: 'TRAVEL_WEBSITE',
    description:
      'Travel website core: destinations, tours, itineraries, and trip inquiries. Live availability and payment are extras.',
    coreItems: [
      { label: 'Destinations and tour catalog' },
      { label: 'Tour details and itinerary' },
      { label: 'Tour search and filters' },
      { label: 'Trip inquiry form' },
      { label: 'Tour content admin' },
      { label: 'Responsive layout and basic SEO' },
    ],
    units: {},
    presets: growPresets(
      [...SITE_LAUNCH, 'CRM_LEAD_CAPTURE', 'MSG_EMAIL_NOTIFICATIONS'],
      ['CNT_MULTILINGUAL', 'INT_MAPS', 'CNT_MEDIA_GALLERY'],
      ['BOOK_RESOURCE_SCHEDULE', 'BOOK_PREPAYMENT', 'ANL_DASHBOARD'],
    ),
  }),
  codeKindProfile({
    keyStem: 'classifieds-portal-code',
    productType: 'CLASSIFIEDS_PORTAL',
    description:
      'Classifieds portal core: user-posted listings, moderation, search, and responses. Checkout and commission are extras.',
    coreItems: [
      { label: 'Poster accounts and listing submission' },
      { label: 'Listing categories and detail pages' },
      { label: 'Listing search and filters' },
      { label: 'Moderation and reporting' },
      { label: 'Contact or response flow' },
      { label: 'Responsive layout and platform admin' },
    ],
    units: {},
    presets: growPresets(
      [...SITE_LAUNCH, 'MSG_EMAIL_NOTIFICATIONS', 'ACC_TWO_FACTOR'],
      ['CNT_MULTILINGUAL', 'MSG_OPERATOR_CHAT', 'ANL_DASHBOARD'],
      ['INT_PUBLIC_API', 'PLT_SECURITY_HARDENING', 'PLT_PERFORMANCE_HARDENING'],
    ),
  }),
  codeKindProfile({
    keyStem: 'job-board-code',
    productType: 'JOB_BOARD',
    description:
      'Job board core: employer vacancies, candidate profiles, applications, and search. Recruiting CRM is an extra.',
    coreItems: [
      { label: 'Employer and candidate accounts' },
      { label: 'Vacancy posting and detail pages' },
      { label: 'Candidate profile and application' },
      { label: 'Vacancy search and filters' },
      { label: 'Application review and moderation' },
      { label: 'Responsive layout and platform admin' },
    ],
    units: {},
    presets: growPresets(
      [...SITE_LAUNCH, 'MSG_EMAIL_NOTIFICATIONS', 'ACC_TWO_FACTOR'],
      ['CNT_MULTILINGUAL', 'ANL_DASHBOARD', 'ACC_TEAM_ACCOUNTS'],
      ['CRM_WORKFLOW_AUTOMATION', 'INT_PUBLIC_API', 'PLT_SECURITY_HARDENING'],
    ),
  }),
];
