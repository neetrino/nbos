'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, FolderKanban, Package } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
  ENTITY_LIST_TYPE_CLASS,
  EntityListIconTile,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
import type { WorkSpace } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';
import { buildWorkSpaceContextHref, getWorkSpaceContextLabel } from './work-space-utils';

interface WorkSpaceListTableProps {
  workspaces: WorkSpace[];
}

export function WorkSpaceListTable({ workspaces }: WorkSpaceListTableProps) {
  const t = useTranslations('workSpaces');
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('table.workSpace')}</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} hidden sm:table-cell`}>
              {t('table.type')}
            </TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} hidden md:table-cell`}>
              {t('table.mode')}
            </TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} hidden lg:table-cell`}>
              {t('table.context')}
            </TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} hidden text-center sm:table-cell`}>
              {t('table.tasks')}
            </TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} w-[1%] text-right`}> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces.map((workspace) => (
            <WorkSpaceListRow key={workspace.id} workspace={workspace} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function WorkSpaceListRow({ workspace }: { workspace: WorkSpace }) {
  const t = useTranslations('workSpaces');
  const router = useRouter();
  const contextHref = buildWorkSpaceContextHref(workspace);
  const taskCount = workspace._count?.tasks ?? workspace.tasks?.length ?? 0;
  const isProductDelivery = workspace.type === 'PRODUCT_DELIVERY';
  const RowIcon = isProductDelivery ? Package : FolderKanban;
  const iconClassName = isProductDelivery
    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
    : 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400';
  const codeLabel =
    workspace.project?.code ?? (workspace.scrumEnabled ? t('mode.scrum') : t('mode.kanban'));

  return (
    <TableRow
      className={`${ENTITY_LIST_ROW_HOVER_CLASS} cursor-pointer`}
      onClick={() => router.push(`/work-spaces/${workspace.id}`)}
    >
      <TableCell className={`${ENTITY_LIST_CELL_CLASS} max-w-[min(100%,320px)]`}>
        <span className="flex min-w-0 items-center gap-2">
          <EntityListIconTile icon={RowIcon} className={iconClassName} />
          <EntityListPrimaryCell title={workspace.name} subtitle={codeLabel} />
        </span>
      </TableCell>
      <TableCell
        className={`${ENTITY_LIST_CELL_CLASS} ${ENTITY_LIST_TYPE_CLASS} hidden sm:table-cell`}
      >
        {t(`type.${workspace.type}`)}
      </TableCell>
      <TableCell
        className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground hidden text-sm md:table-cell`}
      >
        {workspace.scrumEnabled ? t('mode.scrum') : t('mode.kanban')}
      </TableCell>
      <TableCell
        className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground hidden max-w-xs truncate text-sm lg:table-cell`}
      >
        {getWorkSpaceContextLabel(workspace, t('standaloneContext'))}
      </TableCell>
      <TableCell
        className={`${ENTITY_LIST_CELL_CLASS} hidden text-center font-medium tabular-nums sm:table-cell`}
      >
        {taskCount}
      </TableCell>
      <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-right`}>
        {contextHref ? (
          <Link
            href={contextHref}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="hidden xl:inline">{t('context')}</span>
            <ArrowUpRight size={14} className="xl:hidden" aria-hidden />
          </Link>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
