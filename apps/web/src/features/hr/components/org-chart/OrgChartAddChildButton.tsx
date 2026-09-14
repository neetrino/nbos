'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ORG_PLUS_BUTTON_CLASS,
  ORG_PLUS_BUTTON_SIZE_PX,
  ORG_PLUS_OFFSET_Y_PX,
} from './org-chart-constants';
import type { OrgChartLayoutNode } from './org-chart-layout';

export function OrgChartAddChildButton({
  node,
  onAdd,
}: {
  node: OrgChartLayoutNode;
  onAdd: () => void;
}) {
  const t = useTranslations('hr');
  const left = node.x + node.width / 2 - ORG_PLUS_BUTTON_SIZE_PX / 2;
  const top = node.y + node.height + ORG_PLUS_OFFSET_Y_PX;
  return (
    <button
      type="button"
      className={ORG_PLUS_BUTTON_CLASS}
      style={{ left, top, width: ORG_PLUS_BUTTON_SIZE_PX, height: ORG_PLUS_BUTTON_SIZE_PX }}
      aria-label={t('orgChart.addChild')}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onAdd();
      }}
    >
      <Plus className="size-4" aria-hidden />
    </button>
  );
}
