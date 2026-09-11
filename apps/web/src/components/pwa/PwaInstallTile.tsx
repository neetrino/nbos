'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  MOBILE_APP_MENU_GRID_CLASS,
  MOBILE_APP_MENU_TILE_CLASS,
} from '@/components/layout/mobile-app-menu-constants';
import { cn } from '@/lib/utils';
import {
  IOS_ADD_TO_HOME_SCREEN_HINT,
  PWA_ADD_TO_HOME_SCREEN_LABEL,
  PWA_INSTALL_LABEL,
} from './pwa-constants';
import { usePwaInstall } from './use-pwa-install';

const PWA_INSTALL_TILE_ICON_SIZE_PX = 20;

type PwaInstallTileProps = {
  onClose: () => void;
};

export function PwaInstallTile({ onClose }: PwaInstallTileProps) {
  const { offer, promptInstall } = usePwaInstall();

  if (offer === 'hidden') return null;

  const label = offer === 'ios-manual' ? PWA_ADD_TO_HOME_SCREEN_LABEL : PWA_INSTALL_LABEL;

  return (
    <div className={cn(MOBILE_APP_MENU_GRID_CLASS, 'mt-2.5')}>
      <button
        type="button"
        className={MOBILE_APP_MENU_TILE_CLASS}
        onClick={() => {
          onClose();
          if (offer === 'ios-manual') {
            toast.message(IOS_ADD_TO_HOME_SCREEN_HINT);
            return;
          }
          void promptInstall();
        }}
      >
        <Download
          size={PWA_INSTALL_TILE_ICON_SIZE_PX}
          className="text-indigo-600"
          aria-hidden
        />
        <span className="text-sm font-semibold tracking-tight">{label}</span>
      </button>
    </div>
  );
}
