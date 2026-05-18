/** App routes that already expose the full dashboard notes composer. */
export const HEADER_QUICK_NOTE_HIDDEN_PATHS = ['/dashboard'] as const;

/** Collapsed quick-note field width in the top bar. */
export const HEADER_QUICK_NOTE_WIDTH_COLLAPSED_REM = 14;

/** Expanded panel width when composing a longer note. */
export const HEADER_QUICK_NOTE_WIDTH_EXPANDED_REM = 22;

/** Minimum height of the expanded composer panel (px). */
export const HEADER_QUICK_NOTE_EXPANDED_MIN_HEIGHT_PX = 140;

/** True when the header quick-note would duplicate an on-page composer. */
export function isHeaderQuickNoteHiddenPath(pathname: string): boolean {
  return HEADER_QUICK_NOTE_HIDDEN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
