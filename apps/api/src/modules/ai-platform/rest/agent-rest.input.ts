export type AgentRequestBody = Record<string, unknown> | undefined | null;

/**
 * Merges a JSON body with the identifiers taken from the URL.
 *
 * The path always wins. A body that also carries `taskId` or `workspaceId`
 * must not be able to redirect an authorized route at a different record: the
 * gateway authorizes exactly the id it receives, so the resource the caller
 * addressed and the resource that gets checked have to be the same one.
 */
export function withPathOverrides(
  body: AgentRequestBody,
  pathParams: Record<string, string>,
): Record<string, unknown> {
  return { ...(body ?? {}), ...pathParams };
}
