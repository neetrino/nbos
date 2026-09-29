'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MAX_WALLPAPER_EDGE_PX,
  MAX_WALLPAPER_MEGABYTES,
  MIN_WALLPAPER_EDGE_PX,
  type WallpaperSlot,
} from '@nbos/shared';
import { PageHero } from '@/components/shared';
import {
  clearPlatformWallpaper,
  getPlatformAppearance,
  uploadPlatformWallpaper,
} from '@/lib/api/platform-appearance';
import { applyWallpaperCss } from '@/lib/platform-appearance/apply-wallpaper-css';
import type { PlatformAppearanceView } from '@/lib/platform-appearance/types';
import { getApiErrorMessage } from '@/lib/api-errors';
import { AppearanceWallpaperSlotCard } from './AppearanceWallpaperSlotCard';
import { validateWallpaperFile, type WallpaperFileIssue } from './validate-wallpaper-file';

export function AppearanceWallpaperPanel({
  initialAppearance,
}: {
  initialAppearance: PlatformAppearanceView;
}) {
  const t = useTranslations('common.platformAppearance');
  const genericError = useTranslations('common')('genericError');
  const [appearance, setAppearance] = useState(initialAppearance);
  const [busySlot, setBusySlot] = useState<WallpaperSlot | null>(null);
  const [errors, setErrors] = useState<Partial<Record<WallpaperSlot, string>>>({});

  return (
    <div className="space-y-6">
      <PageHero title={t('title')} />
      <p className="text-muted-foreground text-sm">{t('description')}</p>
      <p className="text-muted-foreground text-sm">{t('rules', wallpaperLimits())}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {(['light', 'dark'] as const).map((slot) => (
          <AppearanceWallpaperSlotCard
            key={slot}
            slot={slot}
            wallpaper={appearance[slot]}
            busy={busySlot === slot}
            error={errors[slot] ?? null}
            onSelectFile={(nextSlot, file) => {
              void handleUpload(nextSlot, file);
            }}
            onRemove={(nextSlot) => {
              void handleRemove(nextSlot);
            }}
          />
        ))}
      </div>
    </div>
  );

  async function handleUpload(slot: WallpaperSlot, file: File): Promise<void> {
    const invalid = await validateWallpaperFile(file);
    if (invalid) {
      setErrors((current) => ({ ...current, [slot]: wallpaperIssueText(t, invalid) }));
      return;
    }
    await runSlotAction(slot, () => uploadPlatformWallpaper(slot, file));
  }

  async function handleRemove(slot: WallpaperSlot): Promise<void> {
    await runSlotAction(slot, () => clearPlatformWallpaper(slot));
  }

  async function runSlotAction(
    slot: WallpaperSlot,
    action: () => Promise<PlatformAppearanceView>,
  ): Promise<void> {
    setBusySlot(slot);
    setErrors((current) => ({ ...current, [slot]: undefined }));
    try {
      const next = await action();
      setAppearance(next);
      applyWallpaperCss(next);
    } catch (error) {
      setErrors((current) => ({ ...current, [slot]: getApiErrorMessage(error, genericError) }));
      const latest = await getPlatformAppearance().catch(() => null);
      if (latest) setAppearance(latest);
    } finally {
      setBusySlot(null);
    }
  }
}

function wallpaperLimits() {
  return {
    maxMb: MAX_WALLPAPER_MEGABYTES,
    minPx: MIN_WALLPAPER_EDGE_PX,
    maxPx: MAX_WALLPAPER_EDGE_PX,
  };
}

function wallpaperIssueText(
  t: ReturnType<typeof useTranslations<'common.platformAppearance'>>,
  issue: WallpaperFileIssue,
): string {
  const limits = wallpaperLimits();
  if (issue === 'format') return t('fileFormat');
  if (issue === 'size') return t('fileSize', limits);
  if (issue === 'longEdge') return t('fileLong', limits);
  if (issue === 'shortEdge') return t('fileShort', limits);
  return t('fileUnreadable');
}
