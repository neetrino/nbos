/** Wide modal — closer to Bitrix quick-task width. */
export const QUICK_CREATE_TASK_DIALOG_CLASS =
  'min-w-0 w-full gap-0 overflow-hidden p-0 sm:max-w-[min(42rem,calc(100vw-1.5rem))]';

/** Minimal top/right inset — Bitrix-style header alignment. */
export const QUICK_CREATE_TASK_BODY_CLASS = 'min-w-0 w-full px-3 pb-4 pt-1 sm:px-4 sm:pt-1';

/** Bleeds into body padding so title + icons hug the top-right corner. */
export const QUICK_CREATE_TASK_TITLE_ROW_CLASS =
  'relative -mr-3 -mt-1 min-w-0 w-full pr-[3.25rem] sm:-mr-4 sm:pr-[3.75rem]';

/** Slightly inset from the right edge (Bitrix flame alignment). */
export const QUICK_CREATE_TASK_HEADER_ICONS_CLASS =
  'absolute top-0 right-3 z-10 flex items-center gap-2.5 sm:right-4 sm:gap-3';

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
  'text-foreground caret-foreground py-0 text-2xl leading-snug font-normal placeholder:text-2xl placeholder:text-muted-foreground/60';

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

export const QUICK_CREATE_TASK_ROW_LABEL_CLASS =
  'text-muted-foreground w-[8.25rem] shrink-0 text-sm';
