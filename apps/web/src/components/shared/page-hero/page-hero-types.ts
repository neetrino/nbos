import type { ReactNode } from 'react';

export interface PageHeroProps {
  title?: string;
  /** When false, does not update the app header module title (e.g. entity detail with its own title). */
  syncModuleTitle?: boolean;
  tabs?: ReactNode;
  /**
   * Renders on the same row as `tabs`, trailing edge (e.g. mobile primary +).
   * When set, the tabs row takes the full first toolbar line so tools wrap below.
   */
  tabsEnd?: ReactNode;
  search?: ReactNode;
  secondaryTabs?: ReactNode;
  viewMode?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}
