'use client';

import { LayoutGrid, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { WorkSpacesQuickCreate } from './WorkSpacesQuickCreate';
import { WORK_SPACES_PAGE_SIZE_OPTIONS } from './work-spaces-page-constants';
import {
  WORK_SPACES_CONTROL_INSET,
  WORK_SPACES_TOOLBAR_SURFACE,
  WORK_SPACES_VIEW_TOGGLE_WRAP,
} from './work-spaces-toolbar-constants';

type WorkSpaceDirectoryTab = 'standalone' | 'product';

interface WorkSpacesToolbarProps {
  tab: WorkSpaceDirectoryTab;
  searchInput: string;
  onSearchChange: (value: string) => void;
  mode: 'all' | 'scrum' | 'kanban';
  onModeChange: (value: 'all' | 'scrum' | 'kanban') => void;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  onQuickCreated: () => void;
}

export function WorkSpacesToolbar({
  tab,
  searchInput,
  onSearchChange,
  mode,
  onModeChange,
  pageSize,
  onPageSizeChange,
  view,
  onViewChange,
  onQuickCreated,
}: WorkSpacesToolbarProps) {
  return (
    <div className={WORK_SPACES_TOOLBAR_SURFACE}>
      <div className="flex w-full min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:gap-3">
        <div className="flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 xl:min-w-0 xl:flex-1">
          <div className="relative min-h-11 min-w-0 flex-1">
            <Search
              size={16}
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
            />
            <Input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, project, product…"
              className={cn('h-11 w-full pl-10', WORK_SPACES_CONTROL_INSET)}
              aria-label="Search work spaces"
            />
          </div>
          {tab === 'standalone' ? <WorkSpacesQuickCreate onCreated={onQuickCreated} /> : null}
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5 xl:w-auto xl:flex-nowrap xl:justify-end">
          <Select
            value={mode}
            onValueChange={(value) => onModeChange(value as 'all' | 'scrum' | 'kanban')}
          >
            <SelectTrigger
              className={cn('h-11 min-w-[132px] flex-1 sm:flex-initial', WORK_SPACES_CONTROL_INSET)}
              aria-label="Planning mode filter"
            >
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              <SelectItem value="scrum">Scrum</SelectItem>
              <SelectItem value="kanban">Kanban</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              className={cn('h-11 min-w-[112px] flex-1 sm:flex-initial', WORK_SPACES_CONTROL_INSET)}
              aria-label="Page size"
            >
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {WORK_SPACES_PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className={cn(WORK_SPACES_VIEW_TOGGLE_WRAP, 'ml-auto xl:ml-0')}>
            <Button
              type="button"
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 px-3"
              onClick={() => onViewChange('grid')}
              aria-label="Card grid view"
            >
              <LayoutGrid size={16} />
            </Button>
            <Button
              type="button"
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 px-3"
              onClick={() => onViewChange('list')}
              aria-label="List view"
            >
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
