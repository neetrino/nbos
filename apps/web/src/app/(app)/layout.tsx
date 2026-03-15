import { AppLayout } from '@/components/layout/AppLayout';
import { PermissionProvider } from '@/lib/permissions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionProvider>
      <AppLayout>{children}</AppLayout>
    </PermissionProvider>
  );
}
