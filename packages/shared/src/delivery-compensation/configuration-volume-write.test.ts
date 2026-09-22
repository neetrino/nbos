import { describe, expect, it } from 'vitest';
import { parseConfigurationVolumeBody } from './configuration-volume-write';

const FEATURE_ID = '11111111-2222-3333-4444-555555555555';

describe('parseConfigurationVolumeBody', () => {
  it('reads a core step with a reason', () => {
    expect(
      parseConfigurationVolumeBody({
        target: 'core',
        volumeFactor: '1.4',
        volumeReason: 'the shop foundation is harder',
      }),
    ).toEqual({
      target: 'core',
      featureId: null,
      volumeFactor: '1.4',
      volumeReason: 'the shop foundation is harder',
    });
  });

  it('requires a feature id only for one function', () => {
    expect(() =>
      parseConfigurationVolumeBody({
        target: 'feature',
        volumeFactor: '1.0',
      }),
    ).toThrow(/featureId/);
    expect(
      parseConfigurationVolumeBody({
        target: 'feature',
        featureId: FEATURE_ID,
        volumeFactor: 1,
      }).featureId,
    ).toBe(FEATURE_ID);
  });
});
