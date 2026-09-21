import { isAllowedDeliveryFunctionIcon, OPERATIONAL_DTO_FINANCIAL_KEYS } from './operational-dto';

export const CATALOG_CONTENT_WRITE_FINANCIAL_KEYS = OPERATIONAL_DTO_FINANCIAL_KEYS;

export class CatalogFinancialMassAssignmentError extends Error {
  readonly code = 'CATALOG_FINANCIAL_MASS_ASSIGNMENT';
  readonly keys: readonly string[];

  constructor(keys: readonly string[]) {
    super('Financial fields are not accepted on catalog content writes');
    this.name = 'CatalogFinancialMassAssignmentError';
    this.keys = keys;
  }
}

export class CatalogContentValidationError extends Error {
  readonly code = 'CATALOG_CONTENT_INVALID';

  constructor(message: string) {
    super(message);
    this.name = 'CatalogContentValidationError';
  }
}

export type CatalogContentWriteInput = {
  code: string;
  category: string;
  iconKey: string;
  title: string;
  summary: string;
  scopeBoundaries: string;
  instructions: string;
  acceptanceCriteria: string;
};

function readRequiredString(record: Record<string, unknown>, key: keyof CatalogContentWriteInput) {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new CatalogContentValidationError(`${key} is required`);
  }
  return value.trim();
}

export function parseCatalogContentWriteBody(body: unknown): CatalogContentWriteInput {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new CatalogContentValidationError('body must be an object');
  }
  const record = body as Record<string, unknown>;
  const leaked = [...CATALOG_CONTENT_WRITE_FINANCIAL_KEYS].filter((key) => key in record);
  if (leaked.length > 0) {
    throw new CatalogFinancialMassAssignmentError(leaked);
  }

  const iconKey = readRequiredString(record, 'iconKey');
  if (!isAllowedDeliveryFunctionIcon(iconKey)) {
    throw new CatalogContentValidationError('iconKey is not in the allowlist');
  }

  return {
    code: readRequiredString(record, 'code'),
    category: readRequiredString(record, 'category'),
    iconKey,
    title: readRequiredString(record, 'title'),
    summary: readRequiredString(record, 'summary'),
    scopeBoundaries: readRequiredString(record, 'scopeBoundaries'),
    instructions: readRequiredString(record, 'instructions'),
    acceptanceCriteria: readRequiredString(record, 'acceptanceCriteria'),
  };
}
