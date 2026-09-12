'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { WallpaperSlot } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import type { WallpaperSlotView } from '@/lib/platform-appearance/types';

type AppearanceWallpaperSlotCardProps = {
  slot: WallpaperSlot;
  wallpaper: WallpaperSlotView | null;
  busy: boolean;
  error: string | null;
  onSelectFile: (slot: WallpaperSlot, file: File) => void;
  onRemove: (slot: WallpaperSlot) => void;
};

export function AppearanceWallpaperSlotCard({
  slot,
  wallpaper,
  busy,
  error,
  onSelectFile,
  onRemove,
}: AppearanceWallpaperSlotCardProps) {
  const t = useTranslations('common.platformAppearance');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-foreground text-base font-semibold">{t(slot)}</h2>
      <WallpaperPreview
        wallpaper={wallpaper}
        emptyLabel={t('empty')}
        alt={t('previewAlt', { slot })}
      />
      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".webp,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onSelectFile(slot, file);
          }}
        />
        <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? t('uploading') : t('replace')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || !wallpaper}
          onClick={() => onRemove(slot)}
        >
          {t('remove')}
        </Button>
      </div>
    </section>
  );
}

function WallpaperPreview({
  wallpaper,
  emptyLabel,
  alt,
}: {
  wallpaper: WallpaperSlotView | null;
  emptyLabel: string;
  alt: string;
}) {
  return (
    <div className="border-border bg-muted/40 mt-4 overflow-hidden rounded-xl border">
      {wallpaper ? (
        // Same-origin versioned WebP; next/image cannot cache-bust these admin previews.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={wallpaper.url} alt={alt} className="h-40 w-full object-cover" />
      ) : (
        <div className="text-muted-foreground flex h-40 items-center justify-center px-4 text-sm">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
