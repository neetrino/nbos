/** Centered floating card — not a bottom-docked sheet. Body scrolls; footer stays put. */
export const QUICK_CREATE_TASK_DIALOG_CLASS =
  'flex min-h-0 w-full max-h-[min(90dvh,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(42rem,calc(100vw-1.5rem))]';

/** Minimal top/right inset — Bitrix-style header alignment. */
export const QUICK_CREATE_TASK_BODY_CLASS =
  'min-h-0 min-w-0 w-full flex-1 overflow-y-auto px-3 pb-4 pt-1 sm:px-4 sm:pt-1';

/** Title row — flex keeps long titles from overlapping header actions. */
export const QUICK_CREATE_TASK_TITLE_ROW_CLASS = 'flex min-w-0 w-full items-start gap-3 sm:gap-4';

/** Header actions sit at the right edge with a slight inset from the dialog padding. */
export const QUICK_CREATE_TASK_HEADER_ICONS_CLASS =
  'flex shrink-0 items-center gap-2.5 self-start -mr-0.5 sm:gap-3 sm:-mr-1';

export const TASK_PRIORITY_FLAME_ICON_SIZE = 22;

/** Task sheet header — slightly larger than quick-create toggle. */
export const TASK_SHEET_PRIORITY_FLAME_ICON_SIZE = 26;

/** Plain icon toggle — no border, background, or focus ring. */
export const TASK_PRIORITY_FLAME_BUTTON_CLASS =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-none border-0 bg-transparent p-0 text-muted-foreground/70 shadow-none outline-none ring-0 hover:border-0 hover:bg-transparent hover:shadow-none focus:border-0 focus:bg-transparent focus:shadow-none focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:bg-transparent focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50';

/** Active toggle — solid orange flame via child svg fill. */
export const TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS =
  'text-orange-500 hover:bg-transparent hover:text-orange-600 [&_svg]:fill-current';

/** Urgent flame on cards, lists, KPIs — always filled. */
export const TASK_PRIORITY_FLAME_FILLED_CLASS = 'fill-current text-orange-500';

/** Title textarea — grows with wrapped lines (Bitrix-style). */
export const QUICK_CREATE_TASK_TITLE_INPUT_CLASS =
  'text-foreground caret-foreground py-0 text-xl leading-snug font-normal placeholder:text-xl placeholder:text-muted-foreground/60';

export const QUICK_CREATE_TASK_DESCRIPTION_INPUT_CLASS =
  'text-foreground mt-0 text-sm leading-relaxed placeholder:text-muted-foreground/60';

/** Borderless inputs — no focus ring/border (Bitrix-style plain text). */
export const QUICK_CREATE_TASK_GHOST_INPUT_CLASS =
  'border-0 bg-transparent px-0 shadow-none rounded-none outline-none ring-0 placeholder:text-muted-foreground/60 hover:border-0 hover:bg-transparent hover:shadow-none focus:border-0 focus:bg-transparent focus:shadow-none focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:bg-transparent focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-0';

/** Props that discourage browser autofill / suggestion dropdowns. */
export const QUICK_CREATE_TASK_AUTOCOMPLETE_OFF = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-form-type': 'other',
} as const;

/** Assignee + deadline share one row of outlined Task-card fields. */
export const QUICK_CREATE_TASK_META_GRID_CLASS =
  'grid w-full min-w-0 grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2';

/** Border-notch captions match the create-card surface, not a white pill. */
export const QUICK_CREATE_TASK_OUTLINED_LABEL_SURFACE_CLASS =
  '[&>span]:bg-background [&>button]:bg-background';

/** Files / Checklists / Project — same outline language as NBOS secondary actions. */
export const QUICK_CREATE_TASK_ACTION_BTN_CLASS = 'h-9 rounded-xl px-3 font-normal text-foreground';

export const QUICK_CREATE_TASK_ACTION_ROW_CLASS = 'flex min-w-0 flex-wrap items-center gap-2';

/** Footer: Files / Checklists / Project on the left, Create / Cancel on the right. */
export const QUICK_CREATE_TASK_FOOTER_CLASS =
  'flex min-w-0 shrink-0 flex-wrap items-center gap-2 px-3 py-3 sm:px-4';

/** Project overlay — a bit wider and taller than the default popover. */
export const QUICK_CREATE_TASK_PROJECT_POPOVER_CLASS =
  'w-[min(28rem,calc(100vw-2.5rem))] min-w-[min(24rem,calc(100vw-2.5rem))] gap-0 p-2';

export const QUICK_CREATE_TASK_PROJECT_RESULTS_CLASS = 'max-h-80';

/** Lets the checklist card sit on top of the compact task card without stretching it. */
export const QUICK_CREATE_TASK_DIALOG_STACKED_CLASS = 'overflow-visible';

export const QUICK_CREATE_TASK_STACK_CLASS = 'relative flex min-h-0 flex-1 flex-col';

/** Dims the whole task card; the checklist layer sits on top and does not restyle the form. */
export const QUICK_CREATE_TASK_LAYER_SCRIM_CLASS =
  'absolute inset-0 z-10 rounded-2xl bg-foreground/35';

/** Same width as the task card, covering it from the header down. */
export const QUICK_CREATE_TASK_CHECKLIST_LAYER_CLASS =
  'absolute inset-x-0 top-12 z-20 flex min-h-[min(28rem,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-foreground/15';

/** Dunked task chrome stays under the scrim — no hover, no clicks. */
export const QUICK_CREATE_TASK_UNDER_LAYER_CLASS = 'pointer-events-none';

/** After the 150ms sheet enter so the title can take focus on the phone. */
export const QUICK_CREATE_TITLE_FOCUS_DELAY_MS = 180;
