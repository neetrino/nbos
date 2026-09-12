'use client';

import { HardDrive, Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS,
  ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS,
} from '@/components/shared/entity-sheet-floating-rail';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function WorkSpaceDriveFloatingRail({
  workSpacePageHref,
  driveHref,
}: {
  workSpacePageHref: string;
  driveHref: string;
}) {
  const t = useTranslations('workSpaces');
  const tCommon = useTranslations('common');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        new URL(workSpacePageHref, window.location.origin).toString(),
      );
      toast.success(tCommon('sheet.linkCopied'));
    } catch {
      toast.error(tCommon('sheet.copyFailed'));
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="icon"
        className={ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS}
        aria-label={t('drive.copyLinkAria')}
        title={tCommon('sheet.copyLink')}
        onClick={() => void handleCopyLink()}
      >
        <Link2 className="size-4" aria-hidden />
        <span className={ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS}>{tCommon('sheet.copyLink')}</span>
      </Button>
      <Button
        type="button"
        variant="default"
        size="icon"
        className={cn(
          ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS,
          'ring-primary-foreground/25 size-11 ring-2',
        )}
        aria-label={t('drive.openInDrive')}
        title={t('drive.openInDrive')}
        onClick={() => window.open(driveHref, '_blank', 'noopener,noreferrer')}
      >
        <HardDrive className="size-4" aria-hidden />
        <span className={ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS}>{t('drive.openInDrive')}</span>
      </Button>
    </>
  );
}
