import { LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';

export type TeamDirectoryViewMode = 'list' | 'grid';

export function buildTeamDirectoryViewOptions(
  t: (key: 'directory.grid' | 'directory.list' | 'directory.gridAria' | 'directory.listAria') => string,
): ViewModeOption<TeamDirectoryViewMode>[] {
  return [
    {
      value: 'grid',
      label: t('directory.grid'),
      icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: t('directory.gridAria'),
    },
    {
      value: 'list',
      label: t('directory.list'),
      icon: <List className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: t('directory.listAria'),
    },
  ];
}
