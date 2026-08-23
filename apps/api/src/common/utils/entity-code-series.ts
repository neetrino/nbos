import {
  allocateEntityCodeNumber,
  ENTITY_CODE_SCOPE,
  type EntityCodePrismaClient,
  type EntityCodeScope,
} from './entity-code-counter';

/**
 * Human-readable prefixes for year-scoped business codes.
 * Padding is a minimum width: `INV-2026-9999` is followed by `INV-2026-10000`.
 */
export const ENTITY_CODE_PREFIX = {
  task: 'T',
  invoice: 'INV',
  supportTicket: 'TKT',
  deal: 'D',
  lead: 'L',
  order: 'ORD',
  subscription: 'SUB',
  project: 'P',
} as const;

export type EntityCodePrefix = (typeof ENTITY_CODE_PREFIX)[keyof typeof ENTITY_CODE_PREFIX];

const CODE_SUFFIX_MIN_WIDTH = 4;
const POSTGRES_INTEGER_MAX = 2_147_483_647;

export interface ParsedYearScopedEntityCode {
  prefix: string;
  year: number;
  numericSuffix: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Formats `{prefix}-{year}-{NNNN}`. The suffix grows past four digits instead
 * of wrapping, which is why callers must never compare the full code as text.
 */
export function formatYearScopedEntityCode(
  prefix: string,
  year: number,
  numericSuffix: number,
): string {
  if (!Number.isInteger(numericSuffix) || numericSuffix < 1) {
    throw new Error(`Entity code suffix must be a positive integer, got ${numericSuffix}`);
  }
  return `${prefix}-${year}-${String(numericSuffix).padStart(CODE_SUFFIX_MIN_WIDTH, '0')}`;
}

/**
 * Parses a canonical year-scoped code. Returns `null` for any malformed row
 * rather than guessing a number from a historical accident.
 */
export function parseYearScopedEntityCode(
  code: string,
  prefix: string,
): ParsedYearScopedEntityCode | null {
  const match = new RegExp(`^${escapeRegExp(prefix)}-(\\d{4})-(\\d+)$`).exec(code);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const numericSuffix = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(numericSuffix)) {
    return null;
  }
  if (numericSuffix < 1 || numericSuffix > POSTGRES_INTEGER_MAX) {
    return null;
  }
  return { prefix, year, numericSuffix };
}

async function allocateYearScopedEntityCode(
  prisma: EntityCodePrismaClient,
  scope: EntityCodeScope,
  prefix: string,
  year = new Date().getFullYear(),
): Promise<string> {
  const numericSuffix = await allocateEntityCodeNumber(prisma, scope, year);
  return formatYearScopedEntityCode(prefix, year, numericSuffix);
}

export function allocateInvoiceCode(
  prisma: EntityCodePrismaClient,
  year = new Date().getFullYear(),
): Promise<string> {
  return allocateYearScopedEntityCode(
    prisma,
    ENTITY_CODE_SCOPE.invoice,
    ENTITY_CODE_PREFIX.invoice,
    year,
  );
}

export function allocateSupportTicketCode(
  prisma: EntityCodePrismaClient,
  year = new Date().getFullYear(),
): Promise<string> {
  return allocateYearScopedEntityCode(
    prisma,
    ENTITY_CODE_SCOPE.supportTicket,
    ENTITY_CODE_PREFIX.supportTicket,
    year,
  );
}

export function allocateDealCode(
  prisma: EntityCodePrismaClient,
  year = new Date().getFullYear(),
): Promise<string> {
  return allocateYearScopedEntityCode(
    prisma,
    ENTITY_CODE_SCOPE.deal,
    ENTITY_CODE_PREFIX.deal,
    year,
  );
}

export function allocateLeadCode(
  prisma: EntityCodePrismaClient,
  year = new Date().getFullYear(),
): Promise<string> {
  return allocateYearScopedEntityCode(
    prisma,
    ENTITY_CODE_SCOPE.lead,
    ENTITY_CODE_PREFIX.lead,
    year,
  );
}

export function allocateOrderCode(
  prisma: EntityCodePrismaClient,
  year = new Date().getFullYear(),
): Promise<string> {
  return allocateYearScopedEntityCode(
    prisma,
    ENTITY_CODE_SCOPE.order,
    ENTITY_CODE_PREFIX.order,
    year,
  );
}

export function allocateSubscriptionCode(
  prisma: EntityCodePrismaClient,
  year = new Date().getFullYear(),
): Promise<string> {
  return allocateYearScopedEntityCode(
    prisma,
    ENTITY_CODE_SCOPE.subscription,
    ENTITY_CODE_PREFIX.subscription,
    year,
  );
}

export function allocateProjectCode(
  prisma: EntityCodePrismaClient,
  year = new Date().getFullYear(),
): Promise<string> {
  return allocateYearScopedEntityCode(
    prisma,
    ENTITY_CODE_SCOPE.project,
    ENTITY_CODE_PREFIX.project,
    year,
  );
}
