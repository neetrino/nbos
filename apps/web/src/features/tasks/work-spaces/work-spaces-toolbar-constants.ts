/** Light raised strip: depth without a heavy white outline box. */
export const WORK_SPACES_TOOLBAR_SURFACE =
  'rounded-2xl bg-gradient-to-b from-card via-card to-muted/40 p-2 sm:p-2.5 ' +
  'shadow-[0_5px_0_rgba(15,23,42,0.035),0_2px_8px_rgba(15,23,42,0.055),inset_0_1px_0_rgba(255,255,255,0.9)]';

/** Inset “well” for controls (subtle 3D on light backgrounds). */
export const WORK_SPACES_CONTROL_INSET =
  'rounded-xl border-0 bg-background/90 shadow-[inset_0_2px_5px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.04] ' +
  'transition-shadow focus-visible:ring-2 focus-visible:ring-ring/35';

export const WORK_SPACES_VIEW_TOGGLE_WRAP =
  'flex h-11 shrink-0 items-center rounded-xl bg-muted/45 p-1 shadow-[inset_0_2px_4px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04]';

/** Quick-create capsule: soft contrast, not primary/black. */
export const WORK_SPACES_QUICK_CREATE_WRAP =
  'flex min-w-0 items-center gap-1.5 rounded-xl bg-background/90 p-1 pl-2 shadow-[inset_0_2px_5px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.05]';

/** Sky CTA — readable on light UI without black fill. */
export const WORK_SPACES_CREATE_CTA_CLASS =
  'shrink-0 rounded-lg bg-sky-500 px-3.5 text-white shadow-[0_2px_0_rgba(14,116,144,0.35)] hover:bg-sky-600 active:translate-y-px';
