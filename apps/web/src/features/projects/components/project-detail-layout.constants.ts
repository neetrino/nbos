/** Right sidebar width on project detail (+20% vs prior 20rem / 22rem). */
export const PROJECT_DETAIL_SIDEBAR_CLASS = 'w-full shrink-0 lg:w-96 xl:w-[26.4rem]';

export type ProjectProductsViewMode = 'card' | 'list';

/** Product cards: 1 → 2 (sm) → 3 (2xl) columns; avoids squeezed 4-up rows. */
export const PROJECT_PRODUCTS_CARD_GRID_CLASS =
  'grid min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 2xl:grid-cols-3';

/** Products / Extensions section toolbar: title + scrollable tabs + actions on one row when space allows. */
export const PROJECT_SECTION_TOOLBAR_CLASS = 'flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2';

export const PROJECT_SECTION_TOOLBAR_TITLE_CLASS = 'flex shrink-0 items-center gap-2';

/** Section headings (Products, Extensions) — below project name in app header. */
export const PROJECT_SECTION_TITLE_CLASS =
  'text-base font-semibold tracking-tight text-foreground/90';

export const PROJECT_SECTION_TOOLBAR_TABS_CLASS =
  'min-w-0 w-full overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] sm:w-auto sm:flex-1 [&::-webkit-scrollbar]:hidden';

export const PROJECT_SECTION_TOOLBAR_ACTIONS_CLASS =
  'ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2';
