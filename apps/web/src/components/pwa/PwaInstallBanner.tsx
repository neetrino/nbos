'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { pwaDashboardBannerBodyKey } from './pwa-dashboard-banner-copy';
import { usePwaDashboardBanner } from './use-pwa-dashboard-banner';

const PWA_BANNER_ICON_SIZE_PX = 16;

export function PwaInstallBanner() {
  const { offer, promptInstall, dismiss } = usePwaDashboardBanner();
  const t = useTranslations('navigation');

  if (offer === 'hidden') return null;

  return (
    <aside className="border-border/80 bg-card flex flex-wrap items-center gap-3 rounded-2xl border px-3.5 py-2.5">
      <Download size={PWA_BANNER_ICON_SIZE_PX} className="shrink-0 text-indigo-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm font-semibold tracking-tight">
          {t('pwa.bannerTitle')}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {t(pwaDashboardBannerBodyKey(offer))}
        </p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {offer === 'prompt' ? (
          <Button size="sm" type="button" onClick={() => void promptInstall()}>
            {t('pwa.bannerInstall')}
          </Button>
        ) : null}
        <Button size="sm" type="button" variant="ghost" onClick={dismiss}>
          {t('pwa.bannerDismiss')}
        </Button>
      </div>
    </aside>
  );
}
