import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { APP_INSTALL_STEP_ROW_CLASS } from './app-install-classes';
import { AppInstallCopyArt, AppInstallMenuArt, AppInstallPhoneArt } from './AppInstallStepArt';

export function AppInstallGuide() {
  const t = useTranslations('quick');

  return (
    <ol className="relative">
      <span
        className="bg-border absolute top-3 bottom-3 left-[0.85rem] w-px"
        aria-hidden
      />
      <GuideStep index={1} title={t('install.steps.copy.title')} body={t('install.steps.copy.body')}>
        <AppInstallCopyArt />
      </GuideStep>
      <GuideStep
        index={2}
        title={t('install.steps.paste.title')}
        body={t('install.steps.paste.body')}
      >
        <AppInstallPhoneArt />
      </GuideStep>
      <GuideStep
        index={3}
        title={t('install.steps.browser.title')}
        body={t('install.steps.browser.body')}
      >
        <AppInstallMenuArt />
      </GuideStep>
    </ol>
  );
}

function GuideStep({
  index,
  title,
  body,
  children,
}: {
  index: number;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <li className={APP_INSTALL_STEP_ROW_CLASS}>
      <span className="bg-primary text-primary-foreground relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{body}</p>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}
