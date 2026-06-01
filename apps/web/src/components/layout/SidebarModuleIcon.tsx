import type { SidebarModuleKey } from '@nbos/shared/constants';
import { cn } from '@/lib/utils';
import { SIDEBAR_MODULE_VISUALS } from './sidebar-module-visual';

const SIDEBAR_MODULE_ICON_SIZE_PX = 16;
const SIDEBAR_MODULE_ICON_TILE_CLASS = 'size-7 shrink-0 rounded-md';

interface SidebarModuleIconProps {
  moduleKey: SidebarModuleKey;
  active?: boolean;
  muted?: boolean;
}

/** Module icon — always colored (idle + active). */
export function SidebarModuleIcon({
  moduleKey,
  active = false,
  muted = false,
}: SidebarModuleIconProps) {
  const { Icon, iconClass, tileClass, tileActiveClass } = SIDEBAR_MODULE_VISUALS[moduleKey];

  return (
    <span
      className={cn(
        'flex items-center justify-center transition-all duration-150',
        SIDEBAR_MODULE_ICON_TILE_CLASS,
        active ? tileActiveClass : tileClass,
        muted && 'opacity-55',
      )}
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

export function SidebarModuleMarker({
  moduleKey,
  visible,
}: {
  moduleKey: SidebarModuleKey;
  visible: boolean;
}) {
  const { markerClass } = SIDEBAR_MODULE_VISUALS[moduleKey];

  return (
    <span
      className={cn(
        'absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full transition-opacity duration-150',
        markerClass,
        visible ? 'opacity-100' : 'opacity-0',
      )}
      aria-hidden
    />
  );
}
