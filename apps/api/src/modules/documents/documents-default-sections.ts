/** Canonical default sections per `docs/NBOS/02-Modules/20-Documents/01-Document-Types-and-Data-Model.md`. */
export const DEFAULT_DOCUMENT_SECTIONS = [
  {
    name: 'Company Rules',
    slug: 'company-rules',
    description: 'Policies and internal rules',
    sortOrder: 10,
  },
  {
    name: 'SOP / Processes',
    slug: 'sop-processes',
    description: 'Standard operating procedures',
    sortOrder: 20,
  },
  { name: 'Sales', slug: 'sales', description: 'Sales playbooks and scripts', sortOrder: 30 },
  {
    name: 'Delivery',
    slug: 'delivery',
    description: 'Delivery and implementation guides',
    sortOrder: 40,
  },
  { name: 'Support', slug: 'support', description: 'Support runbooks', sortOrder: 50 },
  { name: 'Finance', slug: 'finance', description: 'Finance-related internal docs', sortOrder: 60 },
  {
    name: 'HR / Onboarding',
    slug: 'hr-onboarding',
    description: 'HR and onboarding materials',
    sortOrder: 70,
  },
  {
    name: 'Technical',
    slug: 'technical',
    description: 'Engineering and architecture notes',
    sortOrder: 80,
  },
  {
    name: 'Templates',
    slug: 'templates',
    description: 'Reusable document templates',
    sortOrder: 90,
  },
  { name: 'Archive', slug: 'archive', description: 'Archived reference material', sortOrder: 100 },
] as const;
