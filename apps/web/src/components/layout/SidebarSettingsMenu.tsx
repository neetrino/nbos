'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, PanelLeft, Settings, UserCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SIDEBAR_NAV_ITEM_CLASS } from './sidebar-layout-constants';

type SidebarSettingsMenuProps = {
  collapsed: boolean;
  onCustomizeMenu: () => void;
};

export function SidebarSettingsMenu({ collapsed, onCustomizeMenu }: SidebarSettingsMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex w-full items-center gap-2 rounded-md text-[13px] font-medium transition-colors',
          SIDEBAR_NAV_ITEM_CLASS,
          collapsed && 'justify-center px-1.5',
        )}
      >
        <Settings size={16} className="shrink-0" />
        {!collapsed && <span className="flex-1 text-left">Settings</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? 'right' : 'top'}
        align="start"
        sideOffset={8}
        className="w-56"
      >
        <DropdownMenuItem onClick={onCustomizeMenu}>
          <PanelLeft size={16} className="opacity-70" />
          Customize left menu
          <ChevronRight size={14} className="ml-auto opacity-50" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings size={16} className="opacity-70" />
          Platform settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/my-account')}>
          <UserCircle2 size={16} className="opacity-70" />
          My account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
