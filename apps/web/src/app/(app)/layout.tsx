import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleAccessGate } from '@/components/layout/ModuleAccessGate';
import { PlatformWallpaperStyle } from '@/components/layout/PlatformWallpaperStyle';
import { PermissionProvider } from '@/lib/permissions';
import { fetchPlatformAppearance } from '@/lib/platform-appearance/fetch-platform-appearance';
import { MessengerPersistProvider } from '@/features/messenger/persist/MessengerPersistProvider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const appearance = await fetchPlatformAppearance();

  return (
    <PermissionProvider>
      <MessengerPersistProvider>
        <PlatformWallpaperStyle appearance={appearance} />
        <AppLayout>
          <ModuleAccessGate>{children}</ModuleAccessGate>
        </AppLayout>
      </MessengerPersistProvider>
    </PermissionProvider>
  );
}
