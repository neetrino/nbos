/** Must match `CLIENT_SERVICE_TASK_ENTITY_TYPE` in API (`client-service-flow-helpers.ts`). */
export const CLIENT_SERVICE_TASK_ENTITY_TYPE = 'ClientServiceRecord' as const;

export function clientServiceTaskDefaultLinks(service: {
  id: string;
  projectId: string;
}): Array<{ entityType: string; entityId: string }> {
  return [
    { entityType: CLIENT_SERVICE_TASK_ENTITY_TYPE, entityId: service.id },
    { entityType: 'PROJECT', entityId: service.projectId },
  ];
}

export function clientServiceTaskDefaultDueDate(
  renewalDate: string | null | undefined,
): string | undefined {
  if (!renewalDate) return undefined;
  return renewalDate.slice(0, 10);
}
