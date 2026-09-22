import { CatalogContentValidationError } from './catalog-write';
import { DELIVERY_MONEY_SCALE, DELIVERY_UNITS_SCALE } from './constants';
import {
  DeliveryDecimalError,
  multiplyScaled,
  parseScaledDecimal,
  quantizeScaled,
  scaledToString,
} from './decimal-scale';

/** One decimal place: 0.5 … 2.0 in steps of 0.1. Stored and compared as tenths. */
export const VOLUME_FACTOR_SCALE = 1;
export const VOLUME_FACTOR_MIN_TENTHS = 5;
export const VOLUME_FACTOR_MAX_TENTHS = 20;
export const VOLUME_FACTOR_STANDARD_TENTHS = 10;
export const VOLUME_FACTOR_STANDARD = '1.0';
export const VOLUME_REASON_MIN_LENGTH = 10;

export type VolumeAdjustment = {
  volumeFactor: string;
  volumeReason: string | null;
};

/**
 * Parses a seller or PM volume adjustment. ×1.0 clears the reason.
 * Any other step requires a short explanation.
 */
export function parseVolumeAdjustment(factor: unknown, reason: unknown): VolumeAdjustment {
  const volumeFactor = formatVolumeFactor(parseVolumeTenths(factor));
  if (isStandardVolumeFactor(volumeFactor)) {
    return { volumeFactor: VOLUME_FACTOR_STANDARD, volumeReason: null };
  }
  return { volumeFactor, volumeReason: requireVolumeReason(reason) };
}

export function isStandardVolumeFactor(raw: string): boolean {
  return volumeTenths(raw) === VOLUME_FACTOR_STANDARD_TENTHS;
}

export function formatVolumeFactor(tenths: number): string {
  return (tenths / 10).toFixed(VOLUME_FACTOR_SCALE);
}

/** Turns a stored decimal such as `1` or `1.50` into the canonical one-decimal step. */
export function normalizeStoredVolumeFactor(raw: string): string {
  const tenths = volumeTenths(raw.trim());
  if (tenths === null || tenths < VOLUME_FACTOR_MIN_TENTHS || tenths > VOLUME_FACTOR_MAX_TENTHS) {
    return VOLUME_FACTOR_STANDARD;
  }
  return formatVolumeFactor(tenths);
}

export function scaleUnits(units: string, factor: string): string {
  return scaleDecimal(units, factor, DELIVERY_UNITS_SCALE);
}

export function scaleMoney(amount: string, factor: string): string {
  return scaleDecimal(amount, factor, DELIVERY_MONEY_SCALE);
}

function scaleDecimal(raw: string, factor: string, scale: number): string {
  const product = multiplyScaled(
    parseScaledDecimal(raw, scale),
    parseScaledDecimal(factor, VOLUME_FACTOR_SCALE),
  );
  return scaledToString(quantizeScaled(product, scale));
}

function parseVolumeTenths(value: unknown): number {
  const text = volumeText(value);
  const tenths = text === null ? null : volumeTenths(text);
  if (tenths === null || tenths < VOLUME_FACTOR_MIN_TENTHS || tenths > VOLUME_FACTOR_MAX_TENTHS) {
    throw new CatalogContentValidationError('volumeFactor must be a step from 0.5 to 2.0.');
  }
  return tenths;
}

function volumeText(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(VOLUME_FACTOR_SCALE);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  return null;
}

function volumeTenths(raw: string): number | null {
  try {
    return Number(parseScaledDecimal(raw, VOLUME_FACTOR_SCALE).value);
  } catch (error) {
    if (error instanceof DeliveryDecimalError) return null;
    throw error;
  }
}

function requireVolumeReason(reason: unknown): string {
  const text = typeof reason === 'string' ? reason.trim() : '';
  if (text.length < VOLUME_REASON_MIN_LENGTH) {
    throw new CatalogContentValidationError(
      `volumeReason must be at least ${VOLUME_REASON_MIN_LENGTH} characters.`,
    );
  }
  return text;
}
