'use client';

import { useTranslations } from 'next-intl';
import { PageHero } from '@/components/shared';
import { APP_INSTALL_CATALOG } from './app-install-catalog';
import {
  APP_INSTALL_GRID_CLASS,
  APP_INSTALL_INTRO_CLASS,
  APP_INSTALL_PAGE_CLASS,
  APP_INSTALL_PANEL_CLASS,
} from './app-install-classes';
import { AppInstallAppList } from './AppInstallAppList';
import { AppInstallGuide } from './AppInstallGuide';
import { useCopyInstallUrl } from './use-copy-install-url';

export function AppInstallPage() {
  const t = useTranslations('quick');
  const { copiedId, copyPath } = useCopyInstallUrl();

  return (
    <div className={APP_INSTALL_PAGE_CLASS}>
      <PageHero title={t('install.title')} />
      <header className={APP_INSTALL_INTRO_CLASS}>
        <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
          {t('install.kicker')}
        </p>
        <h1 className="text-foreground mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('install.title')}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          {t('install.subtitle')}
        </p>
      </header>

      <div className={APP_INSTALL_GRID_CLASS}>
        <section className={APP_INSTALL_PANEL_CLASS} aria-labelledby="app-install-apps">
          <h2 id="app-install-apps" className="text-foreground mb-1 text-base font-semibold">
            {t('install.appsHeading')}
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">{t('install.orderNote')}</p>
          <AppInstallAppList apps={APP_INSTALL_CATALOG} copiedId={copiedId} onCopy={copyPath} />
        </section>

        <section className={APP_INSTALL_PANEL_CLASS} aria-labelledby="app-install-guide">
          <h2 id="app-install-guide" className="text-foreground mb-4 text-base font-semibold">
            {t('install.guideHeading')}
          </h2>
          <AppInstallGuide />
        </section>
      </div>
    </div>
  );
}
