import type { PlatformAppearanceView } from './types';

export function parsePlatformAppearance(body: unknown): PlatformAppearanceView | null {
  const payload = isRecord(body) && isRecord(body.data) ? body.data : body;
  if (!isRecord(payload)) return null;
  return {
    light: readSlot(payload.light),
    dark: readSlot(payload.dark),
  };
}

function readSlot(value: unknown): PlatformAppearanceView['light'] {
  if (!isRecord(value)) return null;
  if (value.slot !== 'light' && value.slot !== 'dark') return null;
  if (typeof value.version !== 'number' || typeof value.url !== 'string') return null;
  if (typeof value.originalFileName !== 'string') return null;
  if (typeof value.bytes !== 'number' || typeof value.width !== 'number') return null;
  if (typeof value.height !== 'number') return null;
  return {
    slot: value.slot,
    version: value.version,
    url: value.url,
    originalFileName: value.originalFileName,
    bytes: value.bytes,
    width: value.width,
    height: value.height,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
