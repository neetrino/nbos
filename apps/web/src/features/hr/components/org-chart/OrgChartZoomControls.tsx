'use client';

import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ORG_ZOOM_BAR_CLASS } from './org-chart-constants';
import { orgChartZoomPercent } from './org-chart-viewport';

export function OrgChartZoomControls({
  scale,
  onFindMe,
  onZoomOut,
  onZoomIn,
}: {
  scale: number;
  onFindMe: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
}) {
  const t = useTranslations('hr');
  return (
    <div className={ORG_ZOOM_BAR_CLASS}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-l-full px-3"
        onClick={onFindMe}
      >
        {t('orgChart.findMe')}
      </Button>
      <span className="bg-border h-5 w-px shrink-0" aria-hidden />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('orgChart.zoomOut')}
        onClick={onZoomOut}
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="text-muted-foreground min-w-12 text-center text-xs tabular-nums">
        {orgChartZoomPercent(scale)} %
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-r-full"
        aria-label={t('orgChart.zoomIn')}
        onClick={onZoomIn}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
