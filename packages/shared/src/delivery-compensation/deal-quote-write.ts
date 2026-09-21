import { CatalogContentValidationError } from './catalog-write';
import {
  DELIVERY_DESIGN_MODES,
  DELIVERY_IMPLEMENTATION_BASES,
  type DeliveryDesignMode,
  type DeliveryImplementationBase,
} from './constants';

export type DealQuoteItemInput = {
  functionId: string;
  tierId: string | null;
};

export type DealQuoteWriteInput = {
  implementationBase: DeliveryImplementationBase;
  designMode: DeliveryDesignMode;
  aiDesignerReview: boolean;
  appliedCollectionId: string | null;
  items: DealQuoteItemInput[];
};

export type DealQuoteApplyCollectionInput = {
  collectionId: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_QUOTE_FUNCTIONS = 120;

/**
 * Parses the seller's draft composition on a deal. A collection id here is last-clicked UI
 * state; the items are the source of truth after any manual edit.
 */
export function parseDealQuoteBody(body: unknown): DealQuoteWriteInput {
  if (!isRecord(body)) {
    throw new CatalogContentValidationError('Body must be an object.');
  }
  return {
    implementationBase: requireOneOf(
      body.implementationBase,
      DELIVERY_IMPLEMENTATION_BASES,
      'implementationBase',
    ),
    designMode: requireOneOf(body.designMode, DELIVERY_DESIGN_MODES, 'designMode'),
    aiDesignerReview: body.aiDesignerReview === true,
    appliedCollectionId: optionalUuid(body.appliedCollectionId, 'appliedCollectionId'),
    items: requireItems(body.items),
  };
}

export function parseDealQuoteApplyCollectionBody(body: unknown): DealQuoteApplyCollectionInput {
  if (!isRecord(body)) {
    throw new CatalogContentValidationError('Body must be an object.');
  }
  const collectionId = optionalUuid(body.collectionId, 'collectionId');
  if (collectionId === null) {
    throw new CatalogContentValidationError('collectionId is required.');
  }
  return { collectionId };
}

function requireItems(value: unknown): DealQuoteItemInput[] {
  if (!Array.isArray(value)) {
    throw new CatalogContentValidationError('items must be an array.');
  }
  if (value.length > MAX_QUOTE_FUNCTIONS) {
    throw new CatalogContentValidationError(
      `A quote cannot hold more than ${MAX_QUOTE_FUNCTIONS} functions.`,
    );
  }
  const items = value.map((entry, index) => requireItem(entry, index));
  if (new Set(items.map((item) => item.functionId)).size !== items.length) {
    throw new CatalogContentValidationError('items contains a duplicate function.');
  }
  return items;
}

function requireItem(entry: unknown, index: number): DealQuoteItemInput {
  if (!isRecord(entry)) {
    throw new CatalogContentValidationError(`items[${index}] must be an object.`);
  }
  return {
    functionId: requireUuid(entry.functionId, `items[${index}].functionId`),
    tierId: optionalUuid(entry.tierId, `items[${index}].tierId`),
  };
}

function requireUuid(value: unknown, field: string): string {
  const id = optionalUuid(value, field);
  if (id === null) {
    throw new CatalogContentValidationError(`${field} must be a uuid.`);
  }
  return id;
}

function optionalUuid(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    throw new CatalogContentValidationError(`${field} must be a uuid.`);
  }
  return value.trim();
}

function requireOneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new CatalogContentValidationError(`${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
