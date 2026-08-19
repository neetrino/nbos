import { describe, expect, it } from 'vitest';
import {
  CRM_ENTITY_TASKS_PAGE_SIZE,
  CRM_TASK_ENTITY_DEAL,
  CRM_TASK_ENTITY_LEAD,
  CRM_TASK_ENTITY_PROJECT,
  buildDealTaskDefaultLinks,
  buildDealTasksListQuery,
  buildLeadTaskDefaultLinks,
  buildLeadTasksListQuery,
  resolveDealProjectId,
} from './crm-entity-task-links';

describe('crm-entity-task-links', () => {
  it('lists deal tasks by DEAL, not the linked project', () => {
    expect(buildDealTasksListQuery('deal-1')).toEqual({
      entityType: CRM_TASK_ENTITY_DEAL,
      entityId: 'deal-1',
      pageSize: CRM_ENTITY_TASKS_PAGE_SIZE,
    });
  });

  it('creates a deal task without a project using only DEAL', () => {
    expect(buildDealTaskDefaultLinks('deal-1')).toEqual([
      { entityType: CRM_TASK_ENTITY_DEAL, entityId: 'deal-1' },
    ]);
    expect(buildDealTaskDefaultLinks('deal-1', null)).toEqual([
      { entityType: CRM_TASK_ENTITY_DEAL, entityId: 'deal-1' },
    ]);
  });

  it('adds PROJECT as an extra link and keeps DEAL first', () => {
    expect(buildDealTaskDefaultLinks('deal-1', 'project-9')).toEqual([
      { entityType: CRM_TASK_ENTITY_DEAL, entityId: 'deal-1' },
      { entityType: CRM_TASK_ENTITY_PROJECT, entityId: 'project-9' },
    ]);
  });

  it('lists and creates lead tasks with LEAD only', () => {
    expect(buildLeadTasksListQuery('lead-3')).toEqual({
      entityType: CRM_TASK_ENTITY_LEAD,
      entityId: 'lead-3',
      pageSize: CRM_ENTITY_TASKS_PAGE_SIZE,
    });
    expect(buildLeadTaskDefaultLinks('lead-3')).toEqual([
      { entityType: CRM_TASK_ENTITY_LEAD, entityId: 'lead-3' },
    ]);
  });

  it('resolves deal project from deal.projectId, then first order', () => {
    expect(resolveDealProjectId({ projectId: 'p-deal', orders: [{ projectId: 'p-order' }] })).toBe(
      'p-deal',
    );
    expect(resolveDealProjectId({ projectId: null, orders: [{ projectId: 'p-order' }] })).toBe(
      'p-order',
    );
    expect(resolveDealProjectId({ projectId: null, orders: [] })).toBeNull();
  });
});
