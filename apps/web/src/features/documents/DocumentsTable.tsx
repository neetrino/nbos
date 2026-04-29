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
  return (
    <div className="border-border rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
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
                  className="text-primary flex items-center gap-2 font-medium hover:underline"
                >
                  <FileText size={14} className="shrink-0 opacity-70" />
                  <span className="truncate">{row.title}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{row.section.name}</TableCell>
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
