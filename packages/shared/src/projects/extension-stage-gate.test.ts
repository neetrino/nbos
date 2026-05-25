import { describe, expect, it } from 'vitest';
import { buildExtensionReadiness, getExtensionStageGateErrors } from './extension-stage-gate';

describe('extension stage gates', () => {
  it('requires description and assignee for NEW → DEVELOPMENT', () => {
    const errors = getExtensionStageGateErrors({ status: 'NEW' }, 'DEVELOPMENT');
    expect(errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['description', 'assignedTo']),
    );
  });

  it('buildExtensionReadiness mirrors development gate fields', () => {
    const summary = buildExtensionReadiness({ status: 'NEW' });
    expect(summary.isReadyForDevelopment).toBe(false);
    expect(summary.missing).toHaveLength(2);
  });
});
