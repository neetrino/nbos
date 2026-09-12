'use client';

import { ChevronDown, Layers, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MobileDockItem } from './MobileDockItem';
import { MOBILE_DOCK_ICON_SIZE_PX } from './mobile-bottom-nav-constants';
import {
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
  const t = useTranslations('navigation');
  const resolvedLabel = label ?? t('mobileDock.defaultScope');
  const ResolvedIcon = Icon ?? Layers;

  return (
    <MobileDockItem
      label={resolvedLabel}
      active={expanded}
      aria-expanded={expanded}
      aria-haspopup="listbox"
      onClick={onClick}
      caption={
        <span className={MOBILE_WORKSPACE_SCOPE_LABEL_CLASS}>
          <span className="truncate">{resolvedLabel}</span>
          <ChevronDown
            size={MOBILE_WORKSPACE_SCOPE_CARET_SIZE}
            strokeWidth={2.25}
            className={MOBILE_WORKSPACE_SCOPE_CARET_CLASS}
            aria-hidden
          />
        </span>
      }
    >
      <ResolvedIcon size={MOBILE_DOCK_ICON_SIZE_PX} aria-hidden />
    </MobileDockItem>
  );
}
