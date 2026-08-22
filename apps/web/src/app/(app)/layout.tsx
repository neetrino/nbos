import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleAccessGate } from '@/components/layout/ModuleAccessGate';
import { PermissionProvider } from '@/lib/permissions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionProvider>
      <AppLayout>
        <ModuleAccessGate>{children}</ModuleAccessGate>
      </AppLayout>
    </PermissionProvider>
  );
}
