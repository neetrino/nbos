'use client';

import Link from 'next/link';
import { ArrowUpRight, FolderKanban, ListChecks } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared';
import type { WorkSpace } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';
import {
  buildWorkSpaceContextHref,
  getWorkSpaceContextLabel,
  getWorkSpaceTypeLabel,
  getWorkSpaceTypeVariant,
} from './work-space-utils';

interface WorkSpaceCardProps {
  workspace: WorkSpace;
}

export function WorkSpaceCard({ workspace }: WorkSpaceCardProps) {
  const contextHref = buildWorkSpaceContextHref(workspace);
  const taskCount = workspace._count?.tasks ?? workspace.tasks?.length ?? 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3">
          <span className="line-clamp-2">{workspace.name}</span>
          <FolderKanban className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        </CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          <StatusBadge
            label={getWorkSpaceTypeLabel(workspace.type)}
            variant={getWorkSpaceTypeVariant(workspace.type)}
          />
          <StatusBadge
            label={workspace.scrumEnabled ? 'Scrum-enabled' : 'Kanban'}
            variant={workspace.scrumEnabled ? 'blue' : 'gray'}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {workspace.description ?? getWorkSpaceContextLabel(workspace)}
        </p>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <ListChecks size={14} />
          <span>{taskCount} tasks</span>
          <span>·</span>
          <span>{getWorkSpaceContextLabel(workspace)}</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Link href={`/work-spaces/${workspace.id}`} className={buttonVariants({ size: 'sm' })}>
          Open Work Space
        </Link>
        {contextHref && (
          <Link
            href={contextHref}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
          >
            Context <ArrowUpRight size={13} />
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
