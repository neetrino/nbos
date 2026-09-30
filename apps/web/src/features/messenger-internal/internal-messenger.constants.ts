export const INTERNAL_MESSENGER_SECTIONS = [
  { id: 'all', label: 'All', href: '/messenger' },
  { id: 'products', label: 'Products', href: '/messenger/products' },
  { id: 'tasks', label: 'Tasks', href: '/messenger/tasks' },
  { id: 'deals', label: 'Deals', href: '/messenger/deals' },
  { id: 'workspaces', label: 'Work Spaces', href: '/messenger/work-spaces' },
  { id: 'groups', label: 'Groups', href: '/messenger/groups' },
  { id: 'direct', label: 'Direct', href: '/messenger/direct' },
  { id: 'collections', label: 'Collections', href: '/messenger/collections' },
] as const;

export type InternalMessengerSectionId = (typeof INTERNAL_MESSENGER_SECTIONS)[number]['id'];

export const INTERNAL_MESSENGER_ENTITY_SECTIONS: ReadonlySet<InternalMessengerSectionId> = new Set([
  'products',
  'tasks',
  'deals',
  'workspaces',
]);

export const INTERNAL_MESSENGER_EMPTY_COPY: Record<InternalMessengerSectionId, string> = {
  all: 'No Internal conversations yet. Open Groups or Direct to start.',
  products: 'No Product conversations yet. Open a Product Chat to start.',
  tasks: 'No Task conversations yet. Open a Task Card and add a note to start.',
  deals: 'No Deal conversations yet. Open Internal discussion on a Deal to start.',
  workspaces: 'No Work Space conversations yet. Open Discussion on a Work Space to start.',
  groups: 'No groups yet. Create an Internal group to start a team conversation.',
  direct: 'No direct messages yet. Start a conversation with a teammate.',
  collections: 'No collections yet. Favorites is created automatically.',
};

export const INTERNAL_MESSENGER_SHELL_CLASS =
  'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white';

/** Space under the last bubble so the overlay composer does not cover it. */
export const SHEET_COMPOSER_OVERLAY_PAD_CLASS = 'pb-16';

/** Gap from the visible bottom before we treat the thread as “reading history”. */
export const SHEET_THREAD_NEAR_END_PX = 80;

/** Same gutter as the sheet composer send control (`px-4` → `right-4`). */
export const SHEET_COMPOSER_GUTTER_CLASS = 'px-4';

export const SHEET_JUMP_TO_END_BUTTON_CLASS =
  'absolute right-4 bottom-16 z-30 flex size-10 items-center justify-center rounded-full bg-white text-[#334155] shadow-[0_2px_10px_rgba(15,23,42,0.16)] transition-[opacity,transform] duration-200 ease-out hover:bg-[#f8fafc]';

/** Long wrapping bubbles use a square-ish corner, not a pill. */
export const SHEET_BUBBLE_LARGE_RADIUS_CLASS = 'rounded-[15px]';
export const SHEET_BUBBLE_WRAP_CHAR_COUNT = 56;

export const INTERNAL_FORWARD_PREVIEW_MAX_LENGTH = 140;
