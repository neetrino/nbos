import { useMemo } from 'react';
import { MobileDockSettingsButton } from '@/components/layout/MobileDockSettingsButton';
import { useRegisterMobileDockWorkspaceActions } from '@/components/layout/MobileModuleDockProvider';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';

export function usePageSettingsDockTrigger(openSheet: () => void): boolean {
  const isMobileViewport = useIsMobileViewport();
  const settings = useMemo(() => <MobileDockSettingsButton onClick={openSheet} />, [openSheet]);
  useRegisterMobileDockWorkspaceActions(isMobileViewport ? { settings } : {});
  return isMobileViewport;
}
