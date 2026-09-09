import type { SidebarModuleKey } from '@nbos/shared/constants';
import { cn } from '@/lib/utils';
import { SIDEBAR_MODULE_VISUALS } from './sidebar-module-visual';

const SIDEBAR_MODULE_ICON_SIZE_PX = 16;

interface SidebarModuleIconProps {
  moduleKey: SidebarModuleKey;
  active?: boolean;
  muted?: boolean;
}

/** Module icon — colored glyph only, no tile or leading rail. */
export function SidebarModuleIcon({
  moduleKey,
  active = false,
  muted = false,
}: SidebarModuleIconProps) {
  const { Icon, iconClass } = SIDEBAR_MODULE_VISUALS[moduleKey];

  return (
    <span
      className={cn('flex size-7 shrink-0 items-center justify-center', muted && 'opacity-55')}
      aria-hidden
    >
      <Icon
        className={iconClass}
        size={SIDEBAR_MODULE_ICON_SIZE_PX}
        strokeWidth={active ? 2.1 : 1.85}
      />
    </span>
  );
}
