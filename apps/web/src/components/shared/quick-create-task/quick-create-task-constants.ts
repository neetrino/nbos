/** Desktop: centered card. Mobile: shared bottom sheet owns max-height. */
export const QUICK_CREATE_TASK_DIALOG_CLASS =
  'flex min-h-0 w-full flex-col gap-0 overflow-hidden p-0 md:max-h-[min(90dvh,calc(100dvh-2rem))] sm:max-w-[min(42rem,calc(100vw-1.5rem))]';

/** Minimal top/right inset — Bitrix-style header alignment. */
export const QUICK_CREATE_TASK_BODY_CLASS =
  'min-h-0 min-w-0 w-full flex-1 overflow-y-auto px-3 pb-4 pt-1 sm:px-4 sm:pt-1 max-md:overflow-visible max-md:px-0 max-md:pb-2';

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
  'flex min-w-0 shrink-0 flex-wrap items-center gap-2 px-3 py-3 sm:px-4 max-md:sticky max-md:bottom-0 max-md:z-10 max-md:flex-col max-md:items-stretch max-md:gap-3 max-md:border-t max-md:border-border/50 max-md:bg-background max-md:px-0 max-md:pb-[max(0.25rem,env(safe-area-inset-bottom))]';

export const QUICK_CREATE_TASK_FOOTER_ACTIONS_CLASS =
  'ml-auto flex flex-wrap items-center gap-3 max-md:ml-0 max-md:w-full max-md:flex-col max-md:items-stretch max-md:gap-2';

export const QUICK_CREATE_TASK_CREATE_BTN_CLASS = 'h-9 rounded-lg px-5 max-md:h-11 max-md:w-full';

export const QUICK_CREATE_TASK_FOOTER_SECONDARY_CLASS =
  'flex flex-wrap items-center gap-3 max-md:justify-between';

/** Project overlay — a bit wider and taller than the default popover. */
export const QUICK_CREATE_TASK_PROJECT_POPOVER_CLASS =
  'w-[min(28rem,calc(100vw-2.5rem))] min-w-[min(24rem,calc(100vw-2.5rem))] gap-0 p-2';

export const QUICK_CREATE_TASK_PROJECT_RESULTS_CLASS = 'max-h-80';

/** Desktop stacked card may overflow; mobile sheet keeps clipping. */
export const QUICK_CREATE_TASK_DIALOG_STACKED_CLASS = 'md:overflow-visible';

export const QUICK_CREATE_TASK_STACK_CLASS = 'relative flex min-h-0 flex-1 flex-col';

/** Fill the sheet; height already shrinks with the keyboard inset. */
export const QUICK_CREATE_TASK_DIALOG_LAYER_OPEN_CLASS =
  'max-md:h-[min(88dvh,calc(100dvh-0.5rem-var(--nbos-dialog-keyboard-inset,0px)))]';

export const QUICK_CREATE_TASK_MOBILE_LAYER_BODY_CLASS =
  'max-md:gap-0 max-md:overflow-hidden max-md:px-0 max-md:pt-0 max-md:pb-0';

export const QUICK_CREATE_TASK_MOBILE_LAYER_STACK_CLASS = 'max-md:h-full';

/** Dims the whole task card; the checklist layer sits on top and does not restyle the form. */
export const QUICK_CREATE_TASK_LAYER_SCRIM_CLASS =
  'absolute inset-0 z-10 rounded-2xl bg-foreground/35 max-md:hidden';

/** Same width as the task card, covering it from the header down. */
export const QUICK_CREATE_TASK_CHECKLIST_LAYER_CLASS =
  'absolute inset-x-0 top-12 z-20 flex min-h-[min(28rem,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-foreground/15 max-md:inset-0 max-md:top-0 max-md:min-h-0 max-md:rounded-none max-md:shadow-none max-md:ring-0';

/** Mobile project search fills the sheet instead of a floating popover. */
export const QUICK_CREATE_TASK_PROJECT_LAYER_CLASS =
  'absolute inset-0 z-20 flex min-h-0 flex-1 flex-col overflow-hidden bg-background';

export const QUICK_CREATE_TASK_PROJECT_MOBILE_RESULTS_CLASS =
  'h-full min-h-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]';

export const QUICK_CREATE_TASK_PROJECT_SEARCH_INPUT_CLASS = 'h-11 rounded-xl';

/** Dunked task chrome stays under the scrim — no hover, no clicks. */
export const QUICK_CREATE_TASK_UNDER_LAYER_CLASS = 'pointer-events-none';

/** After the 150ms sheet enter so the title can take focus on the phone. */
export const QUICK_CREATE_TITLE_FOCUS_DELAY_MS = 180;
