/** Flat track — same idea as TabsList `pill` (muted, no heavy outer shadow). */
export const WORK_SPACES_TOOLBAR_SURFACE = 'rounded-2xl bg-muted p-2 sm:p-2.5';

/**
 * White pill control for search + selects (active tab “lift” language:
 * `bg-background` + soft shadow, no inset wells).
 */
export const WORK_SPACES_CONTROL_PILL =
  'rounded-full border-0 bg-background shadow-sm shadow-black/[0.05] ' +
  'transition-shadow focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-muted';

/** Segmented view switch — white mini-capsule inside the muted toolbar. */
export const WORK_SPACES_VIEW_TOGGLE_WRAP =
  'inline-flex h-10 shrink-0 items-center gap-0.5 rounded-full bg-background p-1 shadow-sm shadow-black/[0.05]';

/** Quick-create row — same white pill treatment. */
export const WORK_SPACES_QUICK_CREATE_WRAP =
  'flex min-h-10 min-w-0 items-center gap-1.5 rounded-full border-0 bg-background py-1 pr-1 pl-3 shadow-sm shadow-black/[0.05]';

/** Sky CTA as a soft pill (not black, not 3D bevel). */
export const WORK_SPACES_CREATE_CTA_CLASS =
  'h-8 shrink-0 rounded-full bg-sky-500 px-4 text-sm font-medium text-white shadow-sm shadow-sky-700/20 hover:bg-sky-600';
