import { describe, expect, it } from 'vitest';
import { parsePlatformAppearance } from './parse-platform-appearance';

describe('platform appearance payload', () => {
  it('reads wrapped and unwrapped slot metadata', () => {
    const raw = {
      light: {
        slot: 'light' as const,
        version: 2,
        url: '/api/v1/platform/appearance/wallpaper/light?v=2',
        originalFileName: 'day.webp',
        bytes: 1000,
        width: 1920,
        height: 1280,
      },
      dark: null,
    };
    expect(parsePlatformAppearance({ data: raw })).toEqual(raw);
    expect(parsePlatformAppearance(raw)).toEqual(raw);
    expect(parsePlatformAppearance({ light: { slot: 'sepia' } })).toEqual({
      light: null,
      dark: null,
    });
  });
});
