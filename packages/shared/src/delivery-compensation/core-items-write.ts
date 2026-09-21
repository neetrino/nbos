import { CatalogContentValidationError } from './catalog-write';

export type CoreItemInput = {
  label: string;
  note: string | null;
};

const MAX_LABEL_LENGTH = 200;
const MAX_NOTE_LENGTH = 500;
const MAX_ITEMS = 40;

/**
 * Parses the structured composition of a product core. Content only: a core item carries no units,
 * because the core is priced by the profile's role units and an item is what the work contains, not
 * what it costs. Order is the array order — position is assigned by the server, never by the client.
 */
export function parseCoreItemsBody(body: unknown): CoreItemInput[] {
  const rows = readArray(body);
  if (rows.length > MAX_ITEMS) {
    throw new CatalogContentValidationError(`A core cannot list more than ${MAX_ITEMS} items.`);
  }
  const items = rows.map((row, index) => parseCoreItem(row, index));
  assertNoDuplicateLabels(items);
  return items;
}

function readArray(body: unknown): unknown[] {
  const value = isRecord(body) ? body.items : body;
  if (!Array.isArray(value)) {
    throw new CatalogContentValidationError('items must be an array of core entries.');
  }
  return value;
}

function parseCoreItem(row: unknown, index: number): CoreItemInput {
  if (!isRecord(row)) {
    throw new CatalogContentValidationError(`items[${index}] must be an object.`);
  }
  return {
    label: requireText(row.label, `items[${index}].label`, MAX_LABEL_LENGTH),
    note: optionalText(row.note, `items[${index}].note`, MAX_NOTE_LENGTH),
  };
}

function assertNoDuplicateLabels(items: readonly CoreItemInput[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    const key = item.label.toLocaleLowerCase();
    if (seen.has(key)) {
      throw new CatalogContentValidationError(`Core item "${item.label}" is listed twice.`);
    }
    seen.add(key);
  }
}

function requireText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CatalogContentValidationError(`${field} is required.`);
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw new CatalogContentValidationError(`${field} must be at most ${maxLength} characters.`);
  }
  return text;
}

function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return requireText(value, field, maxLength);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
