'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import type { WorkSpace } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';
import {
  buildWorkSpaceContextHref,
  getWorkSpaceContextLabel,
  getWorkSpaceTypeLabel,
} from './work-space-utils';

interface WorkSpaceListTableProps {
  workspaces: WorkSpace[];
}

export function WorkSpaceListTable({ workspaces }: WorkSpaceListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Work space</TableHead>
          <TableHead className="hidden sm:table-cell">Type</TableHead>
          <TableHead className="hidden md:table-cell">Mode</TableHead>
          <TableHead className="hidden lg:table-cell">Context</TableHead>
          <TableHead className="hidden text-center sm:table-cell">Tasks</TableHead>
          <TableHead className="w-[1%] text-right"> </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workspaces.map((workspace) => (
          <WorkSpaceListRow key={workspace.id} workspace={workspace} />
        ))}
      </TableBody>
    </Table>
  );
}

function WorkSpaceListRow({ workspace }: { workspace: WorkSpace }) {
  const router = useRouter();
  const contextHref = buildWorkSpaceContextHref(workspace);
  const taskCount = workspace._count?.tasks ?? workspace.tasks?.length ?? 0;
  const isProductDelivery = workspace.type === 'PRODUCT_DELIVERY';
  const RowIcon = isProductDelivery ? Package : FolderKanban;
  const codeLabel = workspace.project?.code ?? (workspace.scrumEnabled ? 'Scrum' : 'Kanban');

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => router.push(`/work-spaces/${workspace.id}`)}
    >
      <TableCell className="max-w-[min(100%,320px)]">
        <div className="flex items-center gap-3">
          <div className="bg-accent/10 text-accent rounded-lg p-1.5">
            <RowIcon size={14} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{workspace.name}</p>
            <p className="text-muted-foreground text-xs">{codeLabel}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
        {getWorkSpaceTypeLabel(workspace.type)}
      </TableCell>
      <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
        {workspace.scrumEnabled ? 'Scrum' : 'Kanban'}
      </TableCell>
      <TableCell className="text-muted-foreground hidden max-w-xs truncate text-sm lg:table-cell">
        {getWorkSpaceContextLabel(workspace)}
      </TableCell>
      <TableCell className="hidden text-center font-medium tabular-nums sm:table-cell">
        {taskCount}
      </TableCell>
      <TableCell className="text-right">
        {contextHref ? (
          <Link
            href={contextHref}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="hidden xl:inline">Context</span>
            <ArrowUpRight size={14} className="xl:hidden" />
          </Link>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
