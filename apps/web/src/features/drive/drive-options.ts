import {
  Archive,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  FileStack,
  FolderOpen,
  FolderKanban,
  Handshake,
  Headset,
  ListTodo,
  PackageCheck,
  Share2,
  type LucideIcon,
} from 'lucide-react';

export type DriveSpaceKey = 'system' | 'company' | 'personal' | 'shared';

export type DriveLibraryKey =
  | 'all'
  | 'deals'
  | 'projects'
  | 'products'
  | 'clients'
  | 'finance'
  | 'partners'
  | 'tasks'
  | 'support'
  | 'company'
  | 'personal'
  | 'shared'
  | 'archive';

export type DriveViewMode = 'cards' | 'list' | 'table';

export type DriveStatusFilter = 'ACTIVE' | 'APPROVED' | 'ARCHIVED';

export interface DriveLibraryOption {
  key: DriveLibraryKey;
  title: string;
  description: string;
  icon: LucideIcon;
  sourceModules?: string[];
  entityTypes?: string[];
  purposes?: string[];
  visibility?: string[];
  status?: DriveStatusFilter;
}

export interface DriveSpaceOption {
  key: DriveSpaceKey;
  title: string;
  /** Short label for the header segmented control */
  segmentLabel: string;
  icon: LucideIcon;
  libraryKeys: DriveLibraryKey[];
  defaultLibraryKey: DriveLibraryKey;
}

export const STATUS_FILTERS: DriveStatusFilter[] = ['ACTIVE', 'APPROVED', 'ARCHIVED'];

export const PURPOSE_OPTIONS = [
  'OFFER_DRAFT',
  'OFFER_SENT',
  'OFFER_APPROVED',
  'MESSENGER_PROOF',
  'CONTRACT',
  'HANDOFF_DOCUMENT',
  'DESIGN_ASSET',
  'DELIVERY_FILE',
  'INVOICE_REQUEST_PROOF',
  'PAYMENT_PROOF',
  'EXPENSE_PROOF',
  'PARTNER_AGREEMENT',
  'SUPPORT_EVIDENCE',
  'TASK_ATTACHMENT',
  'WORKSPACE_ARTIFACT',
  'SOP_DOCUMENT',
  'TRAINING_MATERIAL',
  'MEETING_RECORDING',
  'CALL_RECORDING',
  'OTHER',
] as const;

export const DRIVE_LIBRARIES: DriveLibraryOption[] = [
  {
    key: 'all',
    title: 'All Files',
    description: 'Everything you can access',
    icon: FileStack,
  },
  {
    key: 'deals',
    title: 'Deals',
    description: 'Offers, proofs and contracts',
    icon: BriefcaseBusiness,
    sourceModules: ['CRM', 'DEALS'],
    entityTypes: ['DEAL', 'LEAD'],
    purposes: ['OFFER_DRAFT', 'OFFER_SENT', 'OFFER_APPROVED', 'MESSENGER_PROOF', 'CONTRACT'],
  },
  {
    key: 'projects',
    title: 'Projects',
    description: 'Project handoff and shared files',
    icon: FolderKanban,
    sourceModules: ['PROJECTS', 'PROJECT'],
    entityTypes: ['PROJECT'],
    purposes: ['HANDOFF_DOCUMENT', 'DELIVERY_FILE', 'WORKSPACE_ARTIFACT'],
  },
  {
    key: 'products',
    title: 'Products',
    description: 'Delivery, design and QA assets',
    icon: PackageCheck,
    sourceModules: ['PRODUCTS', 'DELIVERY'],
    entityTypes: ['PRODUCT', 'EXTENSION'],
    purposes: ['DESIGN_ASSET', 'DELIVERY_FILE', 'WORKSPACE_ARTIFACT', 'SUPPORT_EVIDENCE'],
  },
  {
    key: 'clients',
    title: 'Clients',
    description: 'Client and company documents',
    icon: Building2,
    entityTypes: ['CLIENT', 'CONTACT', 'COMPANY'],
    visibility: ['CLIENT_VISIBLE'],
  },
  {
    key: 'finance',
    title: 'Finance',
    description: 'Invoices, payments and exports',
    icon: Banknote,
    sourceModules: ['FINANCE', 'REPORTS'],
    entityTypes: ['INVOICE', 'EXPENSE', 'PAYMENT', 'REPORT'],
    purposes: ['INVOICE_REQUEST_PROOF', 'PAYMENT_PROOF', 'EXPENSE_PROOF'],
  },
  {
    key: 'partners',
    title: 'Partners',
    description: 'Agreements and payout documents',
    icon: Handshake,
    sourceModules: ['PARTNERS'],
    entityTypes: ['PARTNER'],
    purposes: ['PARTNER_AGREEMENT'],
    visibility: ['PARTNER_VISIBLE'],
  },
  {
    key: 'tasks',
    title: 'Tasks & Work Spaces',
    description: 'Attachments and final artifacts',
    icon: ListTodo,
    sourceModules: ['TASKS', 'WORKSPACE'],
    entityTypes: ['TASK', 'WORK_SPACE', 'WORKSPACE'],
    purposes: ['TASK_ATTACHMENT', 'WORKSPACE_ARTIFACT'],
  },
  {
    key: 'support',
    title: 'Support',
    description: 'Evidence, logs and incident docs',
    icon: Headset,
    sourceModules: ['SUPPORT'],
    entityTypes: ['SUPPORT_TICKET'],
    purposes: ['SUPPORT_EVIDENCE'],
  },
  {
    key: 'company',
    title: 'Company Drive',
    description: 'Free company folders',
    icon: FolderOpen,
    sourceModules: ['MY_COMPANY', 'COMPANY'],
    purposes: ['SOP_DOCUMENT', 'TRAINING_MATERIAL'],
  },
  {
    key: 'personal',
    title: 'Personal',
    description: 'Your private work files',
    icon: CircleUserRound,
    visibility: ['PERSONAL'],
  },
  {
    key: 'shared',
    title: 'Shared with me',
    description: 'Files others shared',
    icon: Share2,
  },
  {
    key: 'archive',
    title: 'Archive',
    description: 'Hidden but recoverable assets',
    icon: Archive,
    status: 'ARCHIVED',
  },
];

export const SYSTEM_LIBRARY_KEYS: DriveLibraryKey[] = [
  'all',
  'deals',
  'projects',
  'products',
  'clients',
  'finance',
  'partners',
  'tasks',
  'support',
];

export const FREE_DRIVE_LIBRARY_KEYS: DriveLibraryKey[] = ['company', 'personal', 'shared'];

export const MAINTENANCE_LIBRARY_KEYS: DriveLibraryKey[] = ['archive'];

export const DEFAULT_DRIVE_LIBRARY = DRIVE_LIBRARIES[0]!;

export const DRIVE_SPACES: DriveSpaceOption[] = [
  {
    key: 'system',
    title: 'System Libraries',
    segmentLabel: 'Library Company',
    icon: FileStack,
    libraryKeys: SYSTEM_LIBRARY_KEYS,
    defaultLibraryKey: 'all',
  },
  {
    key: 'company',
    title: 'Company Drive',
    segmentLabel: 'Company Drive',
    icon: FolderOpen,
    libraryKeys: ['company', 'archive'],
    defaultLibraryKey: 'company',
  },
  {
    key: 'personal',
    title: 'Personal',
    segmentLabel: 'Personal',
    icon: CircleUserRound,
    libraryKeys: ['personal', 'archive'],
    defaultLibraryKey: 'personal',
  },
  {
    key: 'shared',
    title: 'Shared with me',
    segmentLabel: 'Shared with me',
    icon: Share2,
    libraryKeys: ['shared', 'archive'],
    defaultLibraryKey: 'shared',
  },
];

export const DEFAULT_DRIVE_SPACE = DRIVE_SPACES[0]!;

export const FALLBACK_MIME_TYPE = 'application/octet-stream';

export const DRIVE_VIEW_MODE_STORAGE_KEY = 'nbos.drive.viewMode';
