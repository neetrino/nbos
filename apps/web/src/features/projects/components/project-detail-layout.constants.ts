/** Right sidebar width on project detail (+20% vs prior 20rem / 22rem). */
export const PROJECT_DETAIL_SIDEBAR_CLASS = 'w-full shrink-0 lg:w-96 xl:w-[26.4rem]';

export type ProjectDetailViewMode = 'card' | 'list';

/** @deprecated Use {@link ProjectDetailViewMode}. */
export type ProjectProductsViewMode = ProjectDetailViewMode;

/** Shared list container for products / extensions on project detail. */
export const PROJECT_ENTITY_LIST_CLASS =
  'border-border divide-border divide-y overflow-hidden rounded-xl border';

/** Product cards: 1 → 2 (sm) → 3 (2xl) columns; avoids squeezed 4-up rows. */
export const PROJECT_PRODUCTS_CARD_GRID_CLASS =
  'grid min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 2xl:grid-cols-3';

/** Section headings (Extensions) — below project name in app header. */
export const PROJECT_SECTION_TITLE_CLASS =
  'text-base font-semibold tracking-tight text-foreground/90';
