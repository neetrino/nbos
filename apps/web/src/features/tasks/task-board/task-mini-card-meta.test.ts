import { describe, expect, it } from 'vitest';
import type { Task, TaskLink } from '@/lib/api/tasks';
import {
  formatTaskCardDate,
  formatTaskCardPeoplePairLabel,
  pickTaskCardContextChips,
} from './task-mini-card-meta';

function link(
  partial: Partial<TaskLink> & Pick<TaskLink, 'id' | 'entityType' | 'entityId'>,
): TaskLink {
  return {
    taskId: 't1',
    createdAt: '2026-01-01T00:00:00.000Z',
    entityLabel: null,
    ...partial,
  };
}

function task(partial: Partial<Task>): Pick<Task, 'links' | 'workspaceId' | 'workspace'> {
  return {
    links: [],
    workspaceId: null,
    workspace: null,
    ...partial,
  };
}

describe('formatTaskCardDate', () => {
  const now = new Date(2026, 7, 17, 15, 30, 0);

  it('shows Today for the current calendar day', () => {
    expect(formatTaskCardDate(new Date(2026, 7, 17).toISOString(), now)).toBe('Today');
  });

  it('shows Tomorrow for the next calendar day', () => {
    expect(formatTaskCardDate(new Date(2026, 7, 18).toISOString(), now)).toBe('Tomorrow');
  });

  it('keeps time when due has a non-midnight time', () => {
    expect(formatTaskCardDate(new Date(2026, 7, 17, 19, 0).toISOString(), now)).toBe(
      'Today, 19:00',
    );
    expect(formatTaskCardDate(new Date(2026, 7, 18, 9, 30).toISOString(), now)).toBe(
      'Tomorrow, 09:30',
    );
  });

  it('falls back to day + English month for other dates', () => {
    expect(formatTaskCardDate(new Date(2026, 7, 19).toISOString(), now)).toBe('19 August');
  });
});

describe('formatTaskCardPeoplePairLabel', () => {
  it('formats creator and assignee with arrow', () => {
    expect(
      formatTaskCardPeoplePairLabel(
        { firstName: 'Anna', lastName: 'Smith' },
        { firstName: 'Bob', lastName: 'Jones' },
      ),
    ).toBe('Set by A. Smith → B. Jones');
  });

  it('shows Unassigned when assignee is missing', () => {
    expect(formatTaskCardPeoplePairLabel({ firstName: 'Anna', lastName: 'Smith' }, null)).toBe(
      'Set by A. Smith → Unassigned',
    );
  });
});

describe('pickTaskCardContextChips', () => {
  it('puts work space first, then product and project', () => {
    const chips = pickTaskCardContextChips(
      task({
        links: [
          link({
            id: 'l1',
            entityType: 'PROJECT',
            entityId: 'p1',
            entityLabel: 'Acme',
          }),
          link({
            id: 'l2',
            entityType: 'PRODUCT',
            entityId: 'prod-1',
            entityLabel: 'Website',
          }),
          link({
            id: 'l3',
            entityType: 'DEAL',
            entityId: 'd1',
            entityLabel: 'Deal A',
          }),
        ],
        workspaceId: 'ws-1',
        workspace: { id: 'ws-1', name: 'Marketing 1' },
      }),
    );

    expect(chips.map((chip) => chip.kind)).toEqual(['WORK_SPACE', 'PRODUCT', 'PROJECT']);
    expect(chips[0]?.label).toBe('Marketing 1');
  });

  it('shows work space from workspaceId even when name is missing after list reload', () => {
    const chips = pickTaskCardContextChips(
      task({
        workspaceId: 'ws-1',
        workspace: null,
      }),
    );

    expect(chips).toEqual([
      {
        key: 'ws:ws-1',
        kind: 'WORK_SPACE',
        entityType: 'WORK_SPACE',
        label: 'Work Space',
      },
    ]);
  });

  it('can hide work space on a workspace board', () => {
    const chips = pickTaskCardContextChips(
      task({
        workspaceId: 'ws-1',
        workspace: { id: 'ws-1', name: 'Marketing 1' },
      }),
      { hideWorkspace: true },
    );
    expect(chips).toEqual([]);
  });

  it('shows project chip even when entityLabel is missing after reload', () => {
    const chips = pickTaskCardContextChips(
      task({
        links: [
          link({
            id: 'l1',
            entityType: 'PROJECT',
            entityId: 'p1',
            entityLabel: null,
          }),
        ],
      }),
    );

    expect(chips).toEqual([
      { key: 'l1', kind: 'PROJECT', entityType: 'PROJECT', label: 'Project' },
    ]);
  });
});
