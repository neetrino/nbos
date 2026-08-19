'use client';

import { ChevronDown, FolderKanban, GitMerge, Link2, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LEAD_SVYAZAT_LABELS } from './lead-svyazat-labels';
import {
  LEAD_SVYAZAT_MENU_GROUPS,
  svyazatMenuItemDisabled,
  type SvyazatMenuMode,
} from './lead-svyazat-menu-items';

const MENU_ITEM_ICONS = {
  merge: GitMerge,
  pour: User,
  create: UserPlus,
  attach: FolderKanban,
} as const;

interface LeadSvyazatDropdownProps {
  hasContact: boolean;
  onSelect: (mode: SvyazatMenuMode) => void;
}

export function LeadSvyazatDropdown(props: LeadSvyazatDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(triggerProps) => (
          <Button {...triggerProps} type="button" size="sm" variant="outline" className="gap-1.5">
            <Link2 size={14} aria-hidden />
            {LEAD_SVYAZAT_LABELS.button}
            <ChevronDown size={14} className="opacity-60" aria-hidden />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="min-w-56">
        {LEAD_SVYAZAT_MENU_GROUPS.map((group, index) => (
          <SvyazatMenuGroup
            key={group.id}
            group={group}
            index={index}
            hasContact={props.hasContact}
            onSelect={props.onSelect}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SvyazatMenuGroup(props: {
  group: (typeof LEAD_SVYAZAT_MENU_GROUPS)[number];
  index: number;
  hasContact: boolean;
  onSelect: (mode: SvyazatMenuMode) => void;
}) {
  return (
    <DropdownMenuGroup>
      {props.index > 0 ? <DropdownMenuSeparator /> : null}
      <DropdownMenuLabel>{props.group.label}</DropdownMenuLabel>
      {props.group.items.map((item) => {
        const Icon = MENU_ITEM_ICONS[item.id];
        return (
          <DropdownMenuItem
            key={item.id}
            disabled={svyazatMenuItemDisabled(item, props.hasContact)}
            onClick={() => props.onSelect(item.id)}
          >
            <Icon size={14} aria-hidden />
            {item.label}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuGroup>
  );
}
