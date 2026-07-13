'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ENTITY_LIST_BADGE_CLASS,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
  EntityListMutedDash,
} from '@/components/shared/entity-list-table';
import type { DocumentListItem } from '@/lib/api/documents';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { formatDocumentRelativeTime } from './format-relative-time';

export function DocumentsTable({ rows }: { rows: DocumentListItem[] }) {
  const showSnippet = rows.some((r) => Boolean(r.searchSnippet));
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Title</TableHead>
            {showSnippet ? <TableHead className={ENTITY_LIST_HEAD_CLASS}>Match</TableHead> : null}
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Section</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Status</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-right`}>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className={ENTITY_LIST_ROW_HOVER_CLASS}>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                <Link
                  href={`/documents/${row.id}`}
                  className="text-foreground hover:text-primary flex flex-col gap-1 hover:underline"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText size={14} className="text-muted-foreground shrink-0" aria-hidden />
                    <span className="truncate text-sm font-bold">{row.title}</span>
                  </span>
                  {row.tagLinks && row.tagLinks.length > 0 ? (
                    <span className="text-muted-foreground flex flex-wrap gap-1 text-xs font-normal">
                      {row.tagLinks.slice(0, 5).map((tl) => (
                        <span key={tl.tag.id} className="bg-muted rounded px-1.5 py-0">
                          {tl.tag.name}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </Link>
              </TableCell>
              {showSnippet ? (
                <TableCell
                  className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground max-w-[14rem] text-xs`}
                >
                  {row.searchSnippet ? (
                    <span className="line-clamp-3">{row.searchSnippet}</span>
                  ) : (
                    <EntityListMutedDash />
                  )}
                </TableCell>
              ) : null}
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                {row.section?.name ? (
                  <span className="text-muted-foreground text-sm">{row.section.name}</span>
                ) : (
                  <EntityListMutedDash />
                )}
              </TableCell>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                <DocumentStatusBadge status={row.status} className={ENTITY_LIST_BADGE_CLASS} />
              </TableCell>
              <TableCell
                className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground text-right text-sm`}
              >
                {formatDocumentRelativeTime(row.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
