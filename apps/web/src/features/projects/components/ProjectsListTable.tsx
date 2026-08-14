'use client';

import { Building2, FolderKanban } from 'lucide-react';
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
  EntityListIconLabel,
  EntityListIconTile,
  EntityListMutedDash,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
import type { Project } from '@/lib/api/projects';

interface ProjectsListTableProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectsListTable({ projects, onProjectClick }: ProjectsListTableProps) {
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Project</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Client</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Company</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-center`}>Products</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-center`}>Orders</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const clientName =
              project.contact?.firstName || project.contact?.lastName
                ? `${project.contact?.firstName ?? ''} ${project.contact?.lastName ?? ''}`.trim()
                : null;

            return (
              <TableRow
                key={project.id}
                className={`${ENTITY_LIST_ROW_HOVER_CLASS} cursor-pointer`}
                onClick={() => onProjectClick(project)}
              >
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <span className="flex min-w-0 items-center gap-2">
                    <EntityListIconTile
                      icon={FolderKanban}
                      className="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                    />
                    <EntityListPrimaryCell title={project.name} subtitle={project.code} />
                  </span>
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {clientName ? (
                    <span className="text-sm">{clientName}</span>
                  ) : (
                    <EntityListMutedDash />
                  )}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {project.company?.name ? (
                    <EntityListIconLabel
                      icon={Building2}
                      iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
                      label={project.company.name}
                    />
                  ) : (
                    <EntityListMutedDash />
                  )}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-center font-medium`}>
                  {project._count.products ?? 0}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-center font-medium`}>
                  {project._count.orders}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
