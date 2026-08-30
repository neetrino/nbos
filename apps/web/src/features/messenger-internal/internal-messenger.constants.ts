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

export const INTERNAL_MESSENGER_COMING_LATER = 'Entity conversations arrive in a later slice.';

export const INTERNAL_MESSENGER_EMPTY_COPY: Record<InternalMessengerSectionId, string> = {
  all: 'No Internal conversations yet. Open Groups or Direct to start.',
  products: INTERNAL_MESSENGER_COMING_LATER,
  tasks: INTERNAL_MESSENGER_COMING_LATER,
  deals: INTERNAL_MESSENGER_COMING_LATER,
  workspaces: INTERNAL_MESSENGER_COMING_LATER,
  groups: 'No groups yet. Create an Internal group to start a team conversation.',
  direct: 'No direct messages yet. Start a conversation with a teammate.',
  collections: 'No collections yet. Favorites is created automatically.',
};

export const INTERNAL_MESSENGER_SHELL_CLASS =
  'flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-[#F5F5F0]';
