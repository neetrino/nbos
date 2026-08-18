'use client';

import { ChevronDown, Zap, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DealSheetActionsMenu({
  actions,
}: {
  actions: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
    enabled: boolean;
    disabledTitle?: string;
    onClick?: () => void;
  }>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button {...props} type="button" variant="outline" size="sm" className="gap-1.5">
            <Zap size={14} aria-hidden />
            Actions
            <ChevronDown size={14} className="opacity-60" aria-hidden />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="min-w-44">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              disabled={!action.enabled}
              title={action.disabledTitle}
              onClick={() => action.onClick?.()}
            >
              <Icon />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
