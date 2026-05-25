import { describe, expect, it } from 'vitest';
import { getProductStageGateErrors } from './product-stage-gate';

describe('getProductStageGateErrors', () => {
  it('requires description, deadline, and order for NEW → CREATING', () => {
    const errors = getProductStageGateErrors({ status: 'NEW' }, 'CREATING');
    expect(errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['description', 'deadline', 'order']),
    );
  });

  it('blocks DEVELOPMENT → QA when tasks are open', () => {
    const errors = getProductStageGateErrors(
      { status: 'DEVELOPMENT', tasks: [{ status: 'IN_PROGRESS' }] },
      'QA',
    );
    expect(errors).toEqual([{ field: 'tasks', message: expect.any(String) }]);
  });

  it('blocks TRANSFER → DONE when client acceptance is missing', () => {
    const errors = getProductStageGateErrors(
      {
        status: 'TRANSFER',
        extensions: [],
        tasks: [],
        tickets: [],
      },
      'DONE',
    );
    expect(errors.some((e) => e.field === 'clientAcceptance')).toBe(true);
  });
});
