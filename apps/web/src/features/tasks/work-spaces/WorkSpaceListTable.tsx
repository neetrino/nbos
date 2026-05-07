'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import type { WorkSpace } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';
import {
  buildWorkSpaceContextHref,
  getWorkSpaceContextLabel,
  getWorkSpaceTypeLabel,
  getWorkSpaceTypeVariant,
} from './work-space-utils';

interface WorkSpaceListTableProps {
  workspaces: WorkSpace[];
}

export function WorkSpaceListTable({ workspaces }: WorkSpaceListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden sm:table-cell">Type</TableHead>
          <TableHead className="hidden md:table-cell">Mode</TableHead>
          <TableHead className="hidden lg:table-cell">Context</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Tasks</TableHead>
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
  const contextHref = buildWorkSpaceContextHref(workspace);
  const taskCount = workspace._count?.tasks ?? workspace.tasks?.length ?? 0;

  return (
    <TableRow>
      <TableCell className="max-w-[min(100%,280px)]">
        <div className="text-foreground font-medium">{workspace.name}</div>
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs lg:hidden">
          {getWorkSpaceContextLabel(workspace)}
        </p>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <StatusBadge
          label={getWorkSpaceTypeLabel(workspace.type)}
          variant={getWorkSpaceTypeVariant(workspace.type)}
        />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <StatusBadge
          label={workspace.scrumEnabled ? 'Scrum' : 'Kanban'}
          variant={workspace.scrumEnabled ? 'blue' : 'gray'}
        />
      </TableCell>
      <TableCell className="text-muted-foreground hidden max-w-xs truncate text-sm lg:table-cell">
        {getWorkSpaceContextLabel(workspace)}
      </TableCell>
      <TableCell className="hidden text-right tabular-nums sm:table-cell">{taskCount}</TableCell>
      <TableCell className="text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/work-spaces/${workspace.id}`} className={buttonVariants({ size: 'sm' })}>
            Open
          </Link>
          {contextHref ? (
            <Link
              href={contextHref}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
            >
              <span className="hidden xl:inline">Context</span>
              <ArrowUpRight size={14} className="xl:hidden" />
            </Link>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
