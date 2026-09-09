import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOBILE_DOCK_ITEM_CLASS } from './mobile-bottom-nav-constants';
import {
  MOBILE_WORKSPACE_DEFAULT_SCOPE_LABEL,
  MOBILE_WORKSPACE_SCOPE_CARET_CLASS,
  MOBILE_WORKSPACE_SCOPE_CARET_SIZE,
  MOBILE_WORKSPACE_SCOPE_LABEL_CLASS,
} from './mobile-workspace-dock-constants';

interface MobileDockSwitcherButtonProps {
  icon?: LucideIcon;
  label?: string;
  expanded: boolean;
  onClick: () => void;
}

export function MobileDockSwitcherButton({
  icon: Icon,
  label,
  expanded,
  onClick,
}: MobileDockSwitcherButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        MOBILE_DOCK_ITEM_CLASS,
        expanded
          ? 'bg-primary/12 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
      )}
      aria-expanded={expanded}
      aria-haspopup="listbox"
    >
      {Icon ? <Icon size={18} aria-hidden /> : null}
      <span className={MOBILE_WORKSPACE_SCOPE_LABEL_CLASS}>
        <span className="truncate">{label ?? MOBILE_WORKSPACE_DEFAULT_SCOPE_LABEL}</span>
        <ChevronDown
          size={MOBILE_WORKSPACE_SCOPE_CARET_SIZE}
          strokeWidth={2.25}
          className={MOBILE_WORKSPACE_SCOPE_CARET_CLASS}
          aria-hidden
        />
      </span>
    </button>
  );
}
