import type { ComponentPropsWithRef } from 'react';
import { Settings } from 'lucide-react';
import { MobileDockItem } from './MobileDockItem';
import { MOBILE_DOCK_ICON_SIZE_PX } from './mobile-bottom-nav-constants';
import { MOBILE_WORKSPACE_SETTINGS_LABEL } from './mobile-workspace-dock-constants';

export function MobileDockSettingsButton(props: ComponentPropsWithRef<'button'>) {
  return (
    <MobileDockItem label={MOBILE_WORKSPACE_SETTINGS_LABEL} {...props}>
      <Settings size={MOBILE_DOCK_ICON_SIZE_PX} aria-hidden />
    </MobileDockItem>
  );
}
