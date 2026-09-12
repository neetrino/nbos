'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MobileDockItem } from './MobileDockItem';
import { MOBILE_DOCK_ICON_SIZE_PX } from './mobile-bottom-nav-constants';
import type { MobileDockCreateAction } from './mobile-module-dock-types';

export function MobileWorkspaceCreateButton({ create }: { create?: MobileDockCreateAction }) {
  const t = useTranslations('navigation');

  if (!create) return null;
  return (
    <MobileDockItem
      label={t('mobileDock.new')}
      disabled={create.disabled}
      onClick={() => {
        if (!create.disabled) create.onSelect();
      }}
    >
      <Plus size={MOBILE_DOCK_ICON_SIZE_PX} aria-hidden />
    </MobileDockItem>
  );
}
