/** Right sidebar width on project detail (+20% vs prior 20rem / 22rem). */
export const PROJECT_DETAIL_SIDEBAR_CLASS = 'w-full shrink-0 lg:w-96 xl:w-[26.4rem]';

export type ProjectProductsViewMode = 'card' | 'list';

/** Product cards: 1 → 2 (sm) → 3 (2xl) columns; avoids squeezed 4-up rows. */
export const PROJECT_PRODUCTS_CARD_GRID_CLASS =
  'grid min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 2xl:grid-cols-3';
