const DARK_BRAND_RELATIVE_LUMA_MAX = 0.22;

/** Near-black brand fills (GitHub, X) stay visible on dark tiles. */
export const DARK_BRAND_ON_DARK_FILL_CLASS = 'dark:fill-neutral-200';

function parseRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

/** True when the official brand hex would disappear on a dark tile. */
export function isDarkBrandHex(hex: string): boolean {
  const rgb = parseRgb(hex);
  if (!rgb) return false;
  const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luma <= DARK_BRAND_RELATIVE_LUMA_MAX;
}
