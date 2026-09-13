import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AppInstallPage } from '@/features/app-install/AppInstallPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('quick');
  return { title: t('install.title') };
}

export default function InstallRoutePage() {
  return <AppInstallPage />;
}
