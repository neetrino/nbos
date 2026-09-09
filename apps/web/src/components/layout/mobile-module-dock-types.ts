import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type MobileDockSource = 'page' | 'secondary' | 'header';

export type MobileDockItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  onSelect?: () => void;
  active: boolean;
};

export type MobileDockTools = {
  search?: ReactNode;
  trailing?: ReactNode;
  tabsEnd?: ReactNode;
};

export const MOBILE_DOCK_CONTENT_SLOTS = 4;
