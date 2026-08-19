import { describe, expect, it } from 'vitest';
import { NAV_MODULE_DEFINITIONS } from './nav-config';

describe('nav quick actions', () => {
  it('assigns unsorted-task create only to the Tasks item', () => {
    const withAction = NAV_MODULE_DEFINITIONS.filter((item) => item.quickAction);

    expect(withAction).toHaveLength(1);
    expect(withAction[0]?.key).toBe('tasks');
    expect(withAction[0]?.quickAction).toBe('create-unsorted-task');
  });
});
