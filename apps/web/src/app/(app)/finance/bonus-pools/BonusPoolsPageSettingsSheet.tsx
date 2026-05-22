'use client';

import Link from 'next/link';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface BonusPoolsPageSettingsSheetProps {
  exportDisabled: boolean;
  exportInProgress: boolean;
  onExportCsv: () => void;
}

export function BonusPoolsPageSettingsSheet({
  exportDisabled,
  exportInProgress,
  onExportCsv,
}: BonusPoolsPageSettingsSheetProps) {
  return (
    <PageSettingsSheet
      title="Bonus pools — settings"
      description="Export product roll-ups or open the bonus board for delivery context."
      triggerAriaLabel="Bonus pools settings"
    >
      <Link
        href="/finance/bonuses"
        className={buttonVariants({ variant: 'outline', className: 'justify-start gap-2' })}
      >
        <ExternalLink className="size-4 shrink-0" aria-hidden />
        Open bonus board
      </Link>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={exportDisabled}
        onClick={() => onExportCsv()}
      >
        {exportInProgress ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4 shrink-0" aria-hidden />
        )}
        Export pools (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
