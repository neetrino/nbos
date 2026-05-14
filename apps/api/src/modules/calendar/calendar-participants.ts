/** Deduplicated internal Neetrino participant ids; always includes the acting user. */
export function normalizeInternalParticipantIds(
  ids: string[] | undefined,
  actorId: string,
): string[] {
  return Array.from(new Set([actorId, ...(ids ?? [])].filter(Boolean)));
}
