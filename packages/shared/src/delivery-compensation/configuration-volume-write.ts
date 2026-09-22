import { CatalogContentValidationError } from './catalog-write';
import { parseVolumeAdjustment, type VolumeAdjustment } from './volume-factor';

const VOLUME_TARGETS = ['core', 'feature', 'extras'] as const;

export type ConfigurationVolumeTarget = (typeof VOLUME_TARGETS)[number];

export type ConfigurationVolumeInput = VolumeAdjustment & {
  target: ConfigurationVolumeTarget;
  featureId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Parses a volume change for a product core, one extra, or every extra on the card. */
export function parseConfigurationVolumeBody(body: unknown): ConfigurationVolumeInput {
  if (!isRecord(body)) {
    throw new CatalogContentValidationError('Body must be an object.');
  }
  const target = body.target;
  if (!isVolumeTarget(target)) {
    throw new CatalogContentValidationError('target must be core, feature, or extras.');
  }
  const featureId = optionalUuid(body.featureId);
  if (target === 'feature' && featureId === null) {
    throw new CatalogContentValidationError('featureId is required.');
  }
  return {
    target,
    featureId: target === 'feature' ? featureId : null,
    ...parseVolumeAdjustment(body.volumeFactor, body.volumeReason),
  };
}

function isVolumeTarget(value: unknown): value is ConfigurationVolumeTarget {
  return typeof value === 'string' && VOLUME_TARGETS.some((target) => target === value);
}

function optionalUuid(value: unknown): string | null {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) return null;
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
