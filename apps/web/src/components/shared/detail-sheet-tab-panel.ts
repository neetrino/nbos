/**
 * Freeze the previous tab body only when the tab actually changes.
 * Same-tab child updates must stay live — a snapshot resets the caret.
 */
export function shouldFreezeOutgoingTabPanel(
  shownTabKey: string,
  activeTabKey: string,
  outgoingActive: boolean,
): boolean {
  return !outgoingActive && shownTabKey !== activeTabKey;
}
