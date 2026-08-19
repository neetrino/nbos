export const CRM_TASK_ENTITY_DEAL = 'DEAL';
export const CRM_TASK_ENTITY_LEAD = 'LEAD';
export const CRM_TASK_ENTITY_PROJECT = 'PROJECT';

/** Deal / lead sheet task lists (not the global tasks board). */
export const CRM_ENTITY_TASKS_PAGE_SIZE = 50;

export interface TaskEntityLink {
  entityType: string;
  entityId: string;
}

export function resolveDealProjectId(deal: {
  projectId?: string | null;
  orders?: Array<{ projectId?: string | null }>;
}): string | null {
  return deal.projectId ?? deal.orders?.[0]?.projectId ?? null;
}

/** Always DEAL; extra PROJECT must not replace DEAL as the list driver. */
export function buildDealTaskDefaultLinks(
  dealId: string,
  projectId?: string | null,
): TaskEntityLink[] {
  const links: TaskEntityLink[] = [{ entityType: CRM_TASK_ENTITY_DEAL, entityId: dealId }];
  if (projectId) {
    links.push({ entityType: CRM_TASK_ENTITY_PROJECT, entityId: projectId });
  }
  return links;
}

export function buildLeadTaskDefaultLinks(leadId: string): TaskEntityLink[] {
  return [{ entityType: CRM_TASK_ENTITY_LEAD, entityId: leadId }];
}

export function buildEntityLinkedTasksQuery(
  entityType: string,
  entityId: string,
): {
  entityType: string;
  entityId: string;
  pageSize: number;
} {
  return { entityType, entityId, pageSize: CRM_ENTITY_TASKS_PAGE_SIZE };
}

export function buildDealTasksListQuery(dealId: string) {
  return buildEntityLinkedTasksQuery(CRM_TASK_ENTITY_DEAL, dealId);
}

export function buildLeadTasksListQuery(leadId: string) {
  return buildEntityLinkedTasksQuery(CRM_TASK_ENTITY_LEAD, leadId);
}
