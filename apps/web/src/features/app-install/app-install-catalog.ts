import { PWA_MAIN_ICON_CACHE } from '@/components/pwa/pwa-constants';
import {
  QUICK_TASK_ICON_CACHE,
  QUICK_TASK_ROUTE,
} from '@/features/quick-actions/quick-action-constants';

export type AppInstallKind = 'mini' | 'main';

export type AppInstallNameKey = 'install.apps.quickTask.name' | 'install.apps.nbos.name';
export type AppInstallBlurbKey = 'install.apps.quickTask.blurb' | 'install.apps.nbos.blurb';

export interface AppInstallEntry {
  id: string;
  path: string;
  kind: AppInstallKind;
  iconSrc: string;
  nameKey: AppInstallNameKey;
  blurbKey: AppInstallBlurbKey;
}

/** Minis first, main NBOS last — Chrome blocks later minis if the root app is already installed. */
export const APP_INSTALL_CATALOG: readonly AppInstallEntry[] = [
  {
    id: 'quick-task',
    path: QUICK_TASK_ROUTE,
    kind: 'mini',
    iconSrc: `/icons/quick-task-192.png?v=${QUICK_TASK_ICON_CACHE}`,
    nameKey: 'install.apps.quickTask.name',
    blurbKey: 'install.apps.quickTask.blurb',
  },
  {
    id: 'nbos',
    path: '/',
    kind: 'main',
    iconSrc: `/icons/icon-192.png?v=${PWA_MAIN_ICON_CACHE}`,
    nameKey: 'install.apps.nbos.name',
    blurbKey: 'install.apps.nbos.blurb',
  },
];

export function buildInstallAbsoluteUrl(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/$/, '');
  if (path === '/') {
    return `${normalizedOrigin}/`;
  }
  return `${normalizedOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}
