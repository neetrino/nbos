'use client';

import type { ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DetailSheetSettingsMenuProps {
  /** Dropdown menu body (e.g. DropdownMenuItem nodes). */
  children: ReactNode;
  align?: 'start' | 'end';
}

/** Gear trigger aligned for detail sheet headers (settings / overflow actions). */
export function DetailSheetSettingsMenu({ children, align = 'end' }: DetailSheetSettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Settings"
          >
            <Settings className="size-4" />
          </Button>
        )}
      />
      <DropdownMenuContent align={align} className="min-w-[10rem]">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
