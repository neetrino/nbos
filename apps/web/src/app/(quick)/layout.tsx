import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { HeaderContextProvider } from '@/components/layout/header-context';
import { MyAccountSheetProvider } from '@/features/account/components/my-account-sheet-provider';
import { PermissionProvider } from '@/lib/permissions';
import {
  QUICK_TASK_ICON_CACHE,
  QUICK_TASK_MANIFEST_PATH,
} from '@/features/quick-actions/quick-action-constants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('quick');
  return {
    title: t('task.appName'),
    applicationName: t('task.appName'),
    manifest: QUICK_TASK_MANIFEST_PATH,
    icons: {
      icon: [
        {
          url: `/icons/quick-task.svg?v=${QUICK_TASK_ICON_CACHE}`,
          type: 'image/svg+xml',
          sizes: 'any',
        },
        {
          url: `/icons/quick-task-192.png?v=${QUICK_TASK_ICON_CACHE}`,
          type: 'image/png',
          sizes: '192x192',
        },
        {
          url: `/icons/quick-task-512.png?v=${QUICK_TASK_ICON_CACHE}`,
          type: 'image/png',
          sizes: '512x512',
        },
      ],
      apple: [
        {
          url: `/icons/quick-task-apple-touch.png?v=${QUICK_TASK_ICON_CACHE}`,
          sizes: '180x180',
        },
      ],
    },
    appleWebApp: {
      capable: true,
      title: t('task.shortName'),
      statusBarStyle: 'default',
    },
  };
}

/** Slim providers only. Tasks PageHero and empty-state account CTA need these. */
export default function QuickLayout({ children }: { children: ReactNode }) {
  return (
    <PermissionProvider>
      <HeaderContextProvider>
        <Suspense fallback={null}>
          <MyAccountSheetProvider>{children}</MyAccountSheetProvider>
        </Suspense>
      </HeaderContextProvider>
    </PermissionProvider>
  );
}
