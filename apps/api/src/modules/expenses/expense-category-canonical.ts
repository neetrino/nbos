/**
 * Canonical expense categories after consolidation (manual / plan selectable).
 * Legacy Prisma enum values remain in DB type but are remapped on write/read paths.
 */
export const EXPENSE_CATEGORY_CANONICAL = [
  'DOMAIN',
  'TOOLS',
  'MARKETING',
  'OFFICE',
  'TAXES',
  'OTHER',
] as const;

export type ExpenseCategoryCanonical = (typeof EXPENSE_CATEGORY_CANONICAL)[number];

const EXPENSE_CATEGORY_CANONICAL_SET = new Set<string>(EXPENSE_CATEGORY_CANONICAL);

/** Map retired category enums onto the 6-bucket model. */
export const EXPENSE_CATEGORY_LEGACY_TO_CANONICAL: Readonly<Record<string, ExpenseCategoryCanonical>> =
  {
    DOMAIN: 'DOMAIN',
    HOSTING: 'DOMAIN',
    SERVICE: 'TOOLS',
    TOOLS: 'TOOLS',
    INTERNAL_INFRA: 'TOOLS',
    MARKETING: 'MARKETING',
    OFFICE: 'OFFICE',
    TAXES: 'TAXES',
    BANK_FEES: 'TAXES',
    TRAINING: 'OTHER',
    OTHER: 'OTHER',
  };

export function coerceExpenseCategoryToCanonical(value: string): ExpenseCategoryCanonical | null {
  const mapped = EXPENSE_CATEGORY_LEGACY_TO_CANONICAL[value];
  if (mapped) return mapped;
  if (EXPENSE_CATEGORY_CANONICAL_SET.has(value)) {
    return value as ExpenseCategoryCanonical;
  }
  return null;
}
