import { PRODUCT_TYPES } from '../constants';
import { CatalogContentValidationError } from './catalog-write';

export type CollectionWriteInput = {
  productType: (typeof PRODUCT_TYPES)[number];
  name: string;
  functionIds: string[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_COLLECTION_FUNCTIONS = 120;
const NAME_MAX_LENGTH = 80;

/**
 * Parses a named extra-function kit. Applying it replaces the deal quote selection; it never
 * makes those functions free and is not a core price.
 */
export function parseCollectionBody(body: unknown): CollectionWriteInput {
  if (!isRecord(body)) {
    throw new CatalogContentValidationError('Body must be an object.');
  }
  return {
    productType: requireProductType(body.productType),
    name: requireName(body.name),
    functionIds: requireFunctionIds(body.functionIds),
  };
}

function requireProductType(value: unknown): (typeof PRODUCT_TYPES)[number] {
  const match = PRODUCT_TYPES.find((option) => option === value);
  if (!match) {
    throw new CatalogContentValidationError('productType is invalid.');
  }
  return match;
}

function requireName(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CatalogContentValidationError('name is required.');
  }
  const name = value.trim();
  if (name.length > NAME_MAX_LENGTH) {
    throw new CatalogContentValidationError('name is too long.');
  }
  return name;
}

function requireFunctionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new CatalogContentValidationError('functionIds must be an array.');
  }
  if (value.length > MAX_COLLECTION_FUNCTIONS) {
    throw new CatalogContentValidationError(
      `A collection cannot hold more than ${MAX_COLLECTION_FUNCTIONS} functions.`,
    );
  }
  const ids = value.map((entry, index) => requireUuid(entry, `functionIds[${index}]`));
  if (new Set(ids).size !== ids.length) {
    throw new CatalogContentValidationError('functionIds contains a duplicate.');
  }
  return ids;
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    throw new CatalogContentValidationError(`${field} must be a function id.`);
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
