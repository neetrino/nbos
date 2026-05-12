import { describe, it, expect } from 'vitest';
import { summarizeChecklistSnapshotProgress } from './checklist-instance-stage-progress';

describe('summarizeChecklistSnapshotProgress', () => {
  it('returns zeros for non-array', () => {
    expect(summarizeChecklistSnapshotProgress(null)).toEqual({
      completed: 0,
      total: 0,
      completedChecklists: 0,
      totalChecklists: 0,
    });
  });

  it('counts DONE and NOT_DONE marks', () => {
    const snap = [{ id: '1', mark: 'DONE' }, { id: '2', mark: 'NOT_DONE' }, { id: '3' }];
    expect(summarizeChecklistSnapshotProgress(snap)).toEqual({
      completed: 2,
      total: 3,
      completedChecklists: 0,
      totalChecklists: 0,
    });
  });
});
