import { describe, expect, it, vi } from 'vitest';
import { applySelectValue } from './select-value';

describe('applySelectValue', () => {
  it('ignores null and empty values', () => {
    const onChange = vi.fn();
    applySelectValue(null, onChange);
    applySelectValue('', onChange);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards a selected id', () => {
    const onChange = vi.fn();
    applySelectValue('ws-1', onChange);
    expect(onChange).toHaveBeenCalledWith('ws-1');
  });
});
