import { CatalogContentValidationError } from './catalog-write';
import { DELIVERY_CONFIG_SIZES, type DeliveryConfigSize } from './constants';

export type SizePresetWriteInput = {
  profileKey: string;
  configSize: DeliveryConfigSize;
  functionIds: string[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PRESET_FUNCTIONS = 120;

/**
 * Parses the module set pre-checked for one size level. A preset is a selling convenience: every
 * function in it is still charged as a normal extra, so this list must never be confused with the
 * included-in-base list, which is the one that makes work free.
 */
export function parseSizePresetBody(body: unknown): SizePresetWriteInput {
  if (!isRecord(body)) {
    throw new CatalogContentValidationError('Body must be an object.');
  }
  return {
    profileKey: requireProfileKey(body.profileKey),
    configSize: requireConfigSize(body.configSize),
    functionIds: requireFunctionIds(body.functionIds),
  };
}

function requireProfileKey(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CatalogContentValidationError('profileKey is required.');
  }
  return value.trim();
}

function requireConfigSize(value: unknown): DeliveryConfigSize {
  if (typeof value !== 'string' || !isConfigSize(value)) {
    throw new CatalogContentValidationError(
      `configSize must be one of: ${DELIVERY_CONFIG_SIZES.join(', ')}.`,
    );
  }
  return value;
}

function requireFunctionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new CatalogContentValidationError('functionIds must be an array.');
  }
  if (value.length > MAX_PRESET_FUNCTIONS) {
    throw new CatalogContentValidationError(
      `A preset cannot hold more than ${MAX_PRESET_FUNCTIONS} functions.`,
    );
  }
  const ids = value.map((entry, index) => requireUuid(entry, `functionIds[${index}]`));
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
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

function isConfigSize(value: string): value is DeliveryConfigSize {
  return (DELIVERY_CONFIG_SIZES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
