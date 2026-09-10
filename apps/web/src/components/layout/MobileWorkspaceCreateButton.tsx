'use client';

import { Plus } from 'lucide-react';
import { MobileDockItem } from './MobileDockItem';
import { MOBILE_DOCK_ICON_SIZE_PX } from './mobile-bottom-nav-constants';
import { MOBILE_WORKSPACE_CREATE_LABEL } from './mobile-workspace-dock-constants';
import type { MobileDockCreateAction } from './mobile-module-dock-types';

export function MobileWorkspaceCreateButton({ create }: { create?: MobileDockCreateAction }) {
  if (!create) return null;
  return (
    <MobileDockItem
      label={MOBILE_WORKSPACE_CREATE_LABEL}
      disabled={create.disabled}
      onClick={() => {
        if (!create.disabled) create.onSelect();
      }}
    >
      <Plus size={MOBILE_DOCK_ICON_SIZE_PX} aria-hidden />
    </MobileDockItem>
  );
}
