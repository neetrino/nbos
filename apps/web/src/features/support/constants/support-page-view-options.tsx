import { LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { SupportTranslator } from '@/features/support/support-message-keys';

export type SupportPageViewMode = 'kanban' | 'list';

export function getSupportPageViewOptions(
  translate?: SupportTranslator,
): ViewModeOption<SupportPageViewMode>[] {
  return [
    {
      value: 'kanban',
      label: translate ? translate('views.board') : 'Board',
      icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: translate ? translate('views.boardAria') : 'Board view',
    },
    {
      value: 'list',
      label: translate ? translate('views.list') : 'List',
      icon: <List className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: translate ? translate('views.listAria') : 'List view',
    },
  ];
}

export const SUPPORT_PAGE_VIEW_OPTIONS: ViewModeOption<SupportPageViewMode>[] =
  getSupportPageViewOptions();
