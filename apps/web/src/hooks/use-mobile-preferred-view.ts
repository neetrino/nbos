import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';

/** Desktop keeps the saved view. Mobile always uses the card-friendly option. */
export function useMobilePreferredView<T>(desktopView: T, mobileView: T): T {
  const isMobileViewport = useIsMobileViewport();
  return isMobileViewport ? mobileView : desktopView;
}
