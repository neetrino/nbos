'use client';

import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { OrgChartLayoutNode } from './org-chart-layout';
import {
  ORG_CARD_SELECTED_CLASS,
  ORG_CARD_SHELL_CLASS,
  ORG_COMPANY_CARD_CLASS,
  ORG_COMPANY_FOOTER_CLASS,
} from './org-chart-constants';

export function OrgCompanyCard({
  node,
  selected,
  childCount,
  expanded,
  onSelect,
  onToggleChildren,
}: {
  node: OrgChartLayoutNode;
  selected: boolean;
  childCount: number;
  expanded: boolean;
  onSelect: () => void;
  onToggleChildren: () => void;
}) {
  const t = useTranslations('hr');
  return (
    <article
      className={cn(
        ORG_CARD_SHELL_CLASS,
        ORG_COMPANY_CARD_CLASS,
        selected && ORG_CARD_SELECTED_CLASS,
      )}
      style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col p-3 text-left"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-start gap-2">
          <FolderKanban className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-foreground truncate text-sm font-semibold">
            {t('orgChart.companyRoot')}
          </p>
        </div>
        <p className="text-muted-foreground mt-3 text-[11px]">{t('orgChart.aboutEmployees')}</p>
        <p className="text-muted-foreground text-[11px]">
          {t('orgChart.employeesCount', { count: 0 })}
        </p>
      </div>
      <button
        type="button"
        className={ORG_COMPANY_FOOTER_CLASS}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggleChildren();
        }}
      >
        {t('orgChart.childCount', { count: childCount })} {expanded ? '▴' : '▾'}
      </button>
    </article>
  );
}
