import { CatalogContentValidationError } from './catalog-write';
import {
  DELIVERY_DESIGN_MODES,
  DELIVERY_IMPLEMENTATION_BASES,
  type DeliveryDesignMode,
  type DeliveryImplementationBase,
} from './constants';

export type ConfigurationParametersInput = {
  implementationBase: DeliveryImplementationBase;
  designMode: DeliveryDesignMode;
  aiDesignerReview: boolean;
};

/**
 * Parameters a PM confirms in Starting. They decide which published base profile prices the core, so
 * they are a closed set of choices: an unknown value would silently match no profile and leave the
 * card unpriceable.
 */
export function parseConfigurationParametersBody(body: unknown): ConfigurationParametersInput {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new CatalogContentValidationError('Body must be an object.');
  }
  const row = body as Record<string, unknown>;
  return {
    implementationBase: requireOneOf(
      row.implementationBase,
      DELIVERY_IMPLEMENTATION_BASES,
      'implementationBase',
    ),
    designMode: requireOneOf(row.designMode, DELIVERY_DESIGN_MODES, 'designMode'),
    aiDesignerReview: row.aiDesignerReview === true,
  };
}

function requireOneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new CatalogContentValidationError(`${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value as T;
}
