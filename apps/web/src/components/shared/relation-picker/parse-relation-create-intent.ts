/** Parses optional `projectId` embedded in a relation create intent (`name@<uuid>`). */
export function parseRelationCreateIntent(intent?: string): {
  fieldIntent?: string;
  projectId?: string;
} {
  if (!intent) return {};
  const at = intent.indexOf('@');
  if (at === -1) return { fieldIntent: intent };
  return {
    fieldIntent: intent.slice(0, at),
    projectId: intent.slice(at + 1) || undefined,
  };
}

/** Builds intent string with optional project scope for product create. */
export function buildRelationCreateIntent(
  fieldIntent: string,
  projectId?: string | null,
): string | undefined {
  if (!fieldIntent) return undefined;
  if (!projectId) return fieldIntent;
  return `${fieldIntent}@${projectId}`;
}
