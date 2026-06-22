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
import type { DocumentListItem } from '@/lib/api/documents';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { formatDocumentRelativeTime } from './format-relative-time';

export function DocumentsTable({ rows }: { rows: DocumentListItem[] }) {
  const showSnippet = rows.some((r) => Boolean(r.searchSnippet));
  return (
    <div className="border-border rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            {showSnippet ? <TableHead>Match</TableHead> : null}
            <TableHead>Section</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link
                  href={`/documents/${row.id}`}
                  className="text-primary flex flex-col gap-1 font-medium hover:underline"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={14} className="shrink-0 opacity-70" />
                    <span className="truncate">{row.title}</span>
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
                <TableCell className="text-muted-foreground max-w-[14rem] text-xs">
                  {row.searchSnippet ? (
                    <span className="line-clamp-3">{row.searchSnippet}</span>
                  ) : (
                    <span>—</span>
                  )}
                </TableCell>
              ) : null}
              <TableCell className="text-muted-foreground text-sm">
                {row.section?.name ?? '—'}
              </TableCell>
              <TableCell>
                <DocumentStatusBadge status={row.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-right text-sm">
                {formatDocumentRelativeTime(row.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
