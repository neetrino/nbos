'use client';

import { Check, ChevronDown, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
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
            <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {index + 1}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- local PWA mark; no next/image localPatterns */}
            <img
              src={app.iconSrc}
              alt=""
              width={APP_INSTALL_ICON_SIZE_PX}
              height={APP_INSTALL_ICON_SIZE_PX}
              className="border-border/70 size-10 shrink-0 rounded-xl border object-cover"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-foreground text-sm leading-5 font-semibold">{t(app.nameKey)}</h3>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-4">
                {t(app.blurbKey)}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 shrink-0"
              onClick={() => onCopy(app.id, app.path)}
            >
              {copiedId === app.id ? <Check size={14} /> : <Copy size={14} />}
              {copiedId === app.id ? t('install.copied') : t('install.copyUrl')}
            </Button>
          </article>
          {index < lastIndex ? (
            <div className="text-muted-foreground flex justify-center py-1.5" aria-hidden>
              <ChevronDown size={16} />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
