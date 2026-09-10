import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleAccessGate } from '@/components/layout/ModuleAccessGate';
import { PermissionProvider } from '@/lib/permissions';
import { MessengerPersistProvider } from '@/features/messenger/persist/MessengerPersistProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionProvider>
      <MessengerPersistProvider>
        <AppLayout>
          <ModuleAccessGate>{children}</ModuleAccessGate>
        </AppLayout>
      </MessengerPersistProvider>
    </PermissionProvider>
  );
}
