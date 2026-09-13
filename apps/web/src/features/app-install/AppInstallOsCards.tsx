import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { APP_INSTALL_OS_CARD_CLASS, APP_INSTALL_OS_GRID_CLASS } from './app-install-classes';
import { AndroidOsMark, IosOsMark } from './AppInstallOsMarks';
import { AndroidInstallShot, IosInstallShot } from './AppInstallOsShots';

export function AppInstallOsCards() {
  const t = useTranslations('quick');

  return (
    <div className={APP_INSTALL_OS_GRID_CLASS}>
      <OsCard
        title={t('install.art.android')}
        hint={t('install.art.androidHint')}
        mark={<AndroidOsMark />}
      >
        <AndroidInstallShot badge={t('install.art.installItem')} />
      </OsCard>
      <OsCard title={t('install.art.ios')} hint={t('install.art.iosHint')} mark={<IosOsMark />}>
        <IosInstallShot badge={t('install.art.homeItem')} />
      </OsCard>
    </div>
  );
}

function OsCard({
  title,
  hint,
  mark,
  children,
}: {
  title: string;
  hint: string;
  mark: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={APP_INSTALL_OS_CARD_CLASS}>
      <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
        {mark}
        {title}
      </div>
      {children}
      <p className="text-muted-foreground text-[11px] leading-4">{hint}</p>
    </div>
  );
}
