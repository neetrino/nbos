import { describe, expect, it } from 'vitest';
import { resolveTaskWorkflowFooterMode } from './task-sheet-workflow-footer';

describe('resolveTaskWorkflowFooterMode', () => {
  it('shows Start and Complete for open tasks', () => {
    expect(resolveTaskWorkflowFooterMode('OPEN')).toBe('start-and-complete');
    expect(resolveTaskWorkflowFooterMode('NEW')).toBe('start-and-complete');
  });

  it('shows only Complete after start', () => {
    expect(resolveTaskWorkflowFooterMode('IN_PROGRESS')).toBe('complete-only');
    expect(resolveTaskWorkflowFooterMode('REVIEW')).toBe('complete-only');
  });

  it('shows only Resume when completed or on hold', () => {
    expect(resolveTaskWorkflowFooterMode('COMPLETED')).toBe('resume-only');
    expect(resolveTaskWorkflowFooterMode('DONE')).toBe('resume-only');
    expect(resolveTaskWorkflowFooterMode('ON_HOLD')).toBe('resume-only');
  });
});
