import { describe, expect, it } from 'vitest';
import { parseReleaseProdArgs, shouldStartDeploy } from './release-prod.lib.mjs';

describe('release prod helpers', () => {
  it('keeps deploy targets and treats :status as check only', () => {
    expect(parseReleaseProdArgs(['--status', 'web'])).toEqual({
      statusOnly: true,
      help: false,
      deployArgs: ['web'],
    });
    expect(parseReleaseProdArgs(['backend'])).toEqual({
      statusOnly: false,
      help: false,
      deployArgs: ['backend'],
    });
  });

  it('starts Coolify deploy only after a successful migrate', () => {
    expect(shouldStartDeploy(0)).toBe(true);
    expect(shouldStartDeploy(1)).toBe(false);
    expect(shouldStartDeploy(2)).toBe(false);
  });
});
