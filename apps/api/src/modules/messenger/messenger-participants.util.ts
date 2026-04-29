/** Canonical order for DM thread participant columns (lexicographic UUID order). */
export function orderedParticipantIds(userId1: string, userId2: string): [string, string] {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}
