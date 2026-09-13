'use client';

import { Check, ChevronDown, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AppInstallEntry } from './app-install-catalog';
import { APP_INSTALL_APP_CARD_CLASS } from './app-install-classes';
import { APP_INSTALL_ICON_SIZE_PX } from './app-install-constants';

interface AppInstallAppListProps {
  apps: readonly AppInstallEntry[];
  copiedId: string | null;
  onCopy: (id: string, path: string) => void;
}

export function AppInstallAppList({ apps, copiedId, onCopy }: AppInstallAppListProps) {
  const t = useTranslations('quick');
  const lastIndex = apps.length - 1;

  return (
    <ol className="flex flex-col">
      {apps.map((app, index) => (
        <li key={app.id} className="flex flex-col">
          <article className={APP_INSTALL_APP_CARD_CLASS}>
            <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {index + 1}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- local PWA mark; no next/image localPatterns */}
            <img
              src={app.iconSrc}
              alt=""
              width={APP_INSTALL_ICON_SIZE_PX}
              height={APP_INSTALL_ICON_SIZE_PX}
              className="border-border/70 size-14 rounded-2xl border object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-foreground text-sm font-semibold">{t(app.nameKey)}</h3>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                    app.kind === 'main'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {app.kind === 'main' ? t('install.lastApp') : t('install.firstApps')}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">{t(app.blurbKey)}</p>
              <p className="text-muted-foreground mt-1 truncate font-mono text-[11px]">{app.path}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2.5 h-8"
                onClick={() => onCopy(app.id, app.path)}
              >
                {copiedId === app.id ? <Check size={14} /> : <Copy size={14} />}
                {copiedId === app.id ? t('install.copied') : t('install.copyUrl')}
              </Button>
            </div>
          </article>
          {index < lastIndex ? (
            <div className="text-muted-foreground flex flex-col items-center py-1.5" aria-hidden>
              <span className="bg-border h-3 w-px" />
              <ChevronDown size={16} />
              <span className="sr-only">{t('install.then')}</span>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
