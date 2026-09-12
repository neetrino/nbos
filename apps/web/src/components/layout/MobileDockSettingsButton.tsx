'use client';

import type { ComponentPropsWithRef } from 'react';
import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MobileDockItem } from './MobileDockItem';
import { MOBILE_DOCK_ICON_SIZE_PX } from './mobile-bottom-nav-constants';

export function MobileDockSettingsButton(props: ComponentPropsWithRef<'button'>) {
  const t = useTranslations('navigation');

  return (
    <MobileDockItem label={t('mobileDock.settings')} {...props}>
      <Settings size={MOBILE_DOCK_ICON_SIZE_PX} aria-hidden />
    </MobileDockItem>
  );
}
