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

export type MobileDockSwitcherGroupId = 'zone' | 'section' | 'category' | 'view';

export type MobileDockSwitcherGroup = {
  id: MobileDockSwitcherGroupId;
  title: string;
  items: MobileDockItem[];
};

export type MobileDockCreateAction = {
  onSelect: () => void;
  disabled?: boolean;
};

export type MobileDockTools = {
  search?: ReactNode;
  trailing?: ReactNode;
  tabsEnd?: ReactNode;
  create?: MobileDockCreateAction;
  settings?: ReactNode;
};
