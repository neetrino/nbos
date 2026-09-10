import { FolderKanban, Package } from 'lucide-react';
import type { HeaderContextContent, HeaderNavItem } from '@/components/layout/header-context';

export type WorkSpaceDirectoryTab = 'standalone' | 'product';

export const WORK_SPACES_DIRECTORY_PATH = '/work-spaces';
export const WORK_SPACES_DIRECTORY_TAB_QUERY = 'wsTab';

export function parseWorkSpaceDirectoryTab(raw: string | null): WorkSpaceDirectoryTab {
  return raw === 'product' ? 'product' : 'standalone';
}

export function workSpacesDirectoryHref(tab: WorkSpaceDirectoryTab): string {
  const qs = workSpacesDirectorySearch(tab, '');
  return qs ? `${WORK_SPACES_DIRECTORY_PATH}?${qs}` : WORK_SPACES_DIRECTORY_PATH;
}

export function workSpacesDirectorySearch(tab: WorkSpaceDirectoryTab, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  if (tab === 'product') params.set(WORK_SPACES_DIRECTORY_TAB_QUERY, 'product');
  else params.delete(WORK_SPACES_DIRECTORY_TAB_QUERY);
  return params.toString();
}

export function workSpacesDirectoryHeaderItems(
  activeTab: WorkSpaceDirectoryTab,
): HeaderNavItem[] {
  return [
    {
      href: workSpacesDirectoryHref('standalone'),
      label: 'Standalone',
      icon: FolderKanban,
      isActive: () => activeTab === 'standalone',
    },
    {
      href: workSpacesDirectoryHref('product'),
      label: 'Product',
      icon: Package,
      isActive: () => activeTab === 'product',
    },
  ];
}

export function workSpacesDirectoryHeaderContent(
  activeTab: WorkSpaceDirectoryTab,
): HeaderContextContent {
  return {
    kind: 'nav',
    ariaLabel: 'Work space type',
    items: workSpacesDirectoryHeaderItems(activeTab),
    fullWidthOnMobile: true,
  };
}
