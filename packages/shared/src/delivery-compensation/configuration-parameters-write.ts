import { CatalogContentValidationError } from './catalog-write';
import {
  frozenDeliveryAxes,
  type DeliveryDesignMode,
  type DeliveryImplementationBase,
} from './constants';

export type ConfigurationParametersInput = {
  implementationBase: DeliveryImplementationBase;
  designMode: DeliveryDesignMode;
  aiDesignerReview: boolean;
};

/**
 * Confirming a card no longer asks for base / design / reviewer. The body may be empty;
 * the server always writes the frozen axes and matches the published core by product type.
 */
export function parseConfigurationParametersBody(body: unknown): ConfigurationParametersInput {
  if (body !== undefined && body !== null && (typeof body !== 'object' || Array.isArray(body))) {
    throw new CatalogContentValidationError('Body must be an object.');
  }
  return frozenDeliveryAxes();
}
