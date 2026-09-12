'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  MOBILE_APP_MENU_GRID_CLASS,
  MOBILE_APP_MENU_TILE_CLASS,
} from '@/components/layout/mobile-app-menu-constants';
import { cn } from '@/lib/utils';
import { usePwaInstall } from './use-pwa-install';

const PWA_INSTALL_TILE_ICON_SIZE_PX = 20;

type PwaInstallTileProps = {
  onClose: () => void;
};

export function PwaInstallTile({ onClose }: PwaInstallTileProps) {
  const { offer, promptInstall } = usePwaInstall();
  const t = useTranslations('navigation');

  if (offer === 'hidden') return null;

  const label = offer === 'ios-manual' ? t('pwa.addToHomeScreen') : t('pwa.install');

  return (
    <div className={cn(MOBILE_APP_MENU_GRID_CLASS, 'mt-2.5')}>
      <button
        type="button"
        className={MOBILE_APP_MENU_TILE_CLASS}
        onClick={() => {
          onClose();
          if (offer === 'ios-manual') {
            toast.message(t('pwa.iosHint'));
            return;
          }
          void promptInstall();
        }}
      >
        <Download size={PWA_INSTALL_TILE_ICON_SIZE_PX} className="text-indigo-600" aria-hidden />
        <span className="text-sm font-semibold tracking-tight">{label}</span>
      </button>
    </div>
  );
}
