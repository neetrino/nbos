import {
  CatalogContentValidationError,
  CatalogFinancialMassAssignmentError,
} from './catalog-write';
import { isAllowedDeliveryFunctionIcon, OPERATIONAL_DTO_FINANCIAL_KEYS } from './operational-dto';

export type CatalogContentPatchInput = {
  category?: string;
  iconKey?: string;
  title: string;
  summary: string;
  scopeBoundaries: string;
  instructions: string;
  acceptanceCriteria: string;
};

function readRequiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new CatalogContentValidationError(`${key} is required`);
  }
  return value.trim();
}

export function parseCatalogContentPatchBody(body: unknown): CatalogContentPatchInput {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new CatalogContentValidationError('body must be an object');
  }
  const record = body as Record<string, unknown>;
  const leaked = [...OPERATIONAL_DTO_FINANCIAL_KEYS].filter((key) => key in record);
  if (leaked.length > 0) {
    throw new CatalogFinancialMassAssignmentError(leaked);
  }
  if ('code' in record) {
    throw new CatalogContentValidationError('code is immutable after create');
  }

  const patch: CatalogContentPatchInput = {
    title: readRequiredString(record, 'title'),
    summary: readRequiredString(record, 'summary'),
    scopeBoundaries: readRequiredString(record, 'scopeBoundaries'),
    instructions: readRequiredString(record, 'instructions'),
    acceptanceCriteria: readRequiredString(record, 'acceptanceCriteria'),
  };
  if (typeof record.category === 'string' && record.category.trim()) {
    patch.category = record.category.trim();
  }
  if (typeof record.iconKey === 'string' && record.iconKey.trim()) {
    if (!isAllowedDeliveryFunctionIcon(record.iconKey.trim())) {
      throw new CatalogContentValidationError('iconKey is not in the allowlist');
    }
    patch.iconKey = record.iconKey.trim();
  }
  return patch;
}
