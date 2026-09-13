import { useTranslations } from 'next-intl';
import { APP_INSTALL_PHONE_FRAME_CLASS } from './app-install-constants';

export function AppInstallCopyArt() {
  return (
    <div
      className="border-border bg-muted/40 flex h-20 w-28 items-center justify-center rounded-2xl border"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="bg-background text-muted-foreground rounded-md border px-2 py-1 font-mono text-[10px]">
          /quick/task
        </span>
        <span className="bg-primary text-primary-foreground rounded-md px-2 py-0.5 text-[10px] font-semibold">
          URL
        </span>
      </div>
    </div>
  );
}

export function AppInstallPhoneArt() {
  const t = useTranslations('quick');
  return (
    <div className={APP_INSTALL_PHONE_FRAME_CLASS} aria-hidden>
      <div className="bg-muted/80 absolute inset-x-0 top-0 z-10 flex h-6 items-center px-1.5">
        <span className="bg-background text-muted-foreground w-full truncate rounded px-1 text-[7px]">
          nbos…
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- local splash preview; no next/image localPatterns */}
      <img
        src="/icons/splash.png"
        alt={t('install.art.phoneAlt')}
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  );
}

export function AppInstallMenuArt() {
  const t = useTranslations('quick');
  return (
    <div className="border-border bg-background relative w-36 rounded-2xl border p-2 shadow-sm">
      <p className="text-muted-foreground mb-1.5 text-[10px] font-medium">{t('install.art.menu')}</p>
      <ul className="space-y-1" aria-hidden>
        <li className="text-muted-foreground px-2 py-1 text-[10px]">⋯</li>
        <li className="bg-primary/10 text-primary rounded-md px-2 py-1 text-[10px] font-semibold">
          {t('install.art.installItem')}
        </li>
        <li className="text-muted-foreground px-2 py-1 text-[10px]">{t('install.art.homeItem')}</li>
      </ul>
    </div>
  );
}
