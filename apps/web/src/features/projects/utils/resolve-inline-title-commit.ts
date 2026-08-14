export type InlineTitleCommitDecision =
  | { action: 'cancel' }
  | { action: 'noop' }
  | { action: 'commit'; value: string };

/**
 * Decide whether an inline title draft should cancel, close without save, or commit.
 * Empty / whitespace-only drafts cancel (restore previous value).
 */
export function resolveInlineTitleCommit(
  draft: string,
  currentValue: string,
): InlineTitleCommitDecision {
  const trimmed = draft.trim();
  if (!trimmed) return { action: 'cancel' };
  if (trimmed === currentValue) return { action: 'noop' };
  return { action: 'commit', value: trimmed };
}
