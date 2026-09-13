import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { PermissionProvider } from '@/lib/permissions';
import { QUICK_TASK_MANIFEST_PATH } from '@/features/quick-actions/quick-action-constants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('quick');
  return {
    title: t('task.appName'),
    applicationName: t('task.appName'),
    manifest: QUICK_TASK_MANIFEST_PATH,
    icons: {
      icon: [
        { url: '/icons/quick-task.svg', type: 'image/svg+xml', sizes: 'any' },
        { url: '/icons/quick-task-192.png', type: 'image/png', sizes: '192x192' },
        { url: '/icons/quick-task-512.png', type: 'image/png', sizes: '512x512' },
      ],
      apple: [{ url: '/icons/quick-task-apple-touch.png', sizes: '180x180' }],
    },
    appleWebApp: {
      capable: true,
      title: t('task.shortName'),
      statusBarStyle: 'default',
    },
  };
}

export default function QuickLayout({ children }: { children: ReactNode }) {
  return <PermissionProvider>{children}</PermissionProvider>;
}
