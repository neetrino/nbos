'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, BookOpenText, RefreshCw } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/shared';
import { documentsApi, type DocumentListItem, type DocumentSection } from '@/lib/api/documents';

const SOP_REVIEW_DUE_DAYS = 30;

function daysFromNow(iso: string): number {
  const now = new Date();
  const then = new Date(iso);
  return Math.floor((now.getTime() - then.getTime()) / (24 * 60 * 60 * 1000));
}

export default function SopPage() {
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [sectionRows, documentRows] = await Promise.all([
        documentsApi.listSections(),
        documentsApi.listDocuments({ search: 'sop' }),
      ]);
      setSections(sectionRows);
      setDocs(documentRows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const reviewQueue = useMemo(
    () => docs.filter((row) => row.updatedAt && daysFromNow(row.updatedAt) >= SOP_REVIEW_DUE_DAYS),
    [docs],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="SOP & Templates"
        description="Operational SOP runtime library linked with Documents: review queue, section coverage, and process ownership references."
      >
        <button
          type="button"
          onClick={() => void load()}
          className="border-border bg-background hover:bg-muted inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <BookOpenText size={16} />
            SOP-like documents
          </div>
          <p className="text-foreground text-2xl font-semibold">{docs.length}</p>
          <p className="text-muted-foreground text-xs">
            Search: &quot;sop&quot; in Documents module
          </p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <ClipboardList size={16} />
            Review queue
          </div>
          <p className="text-foreground text-2xl font-semibold">{reviewQueue.length}</p>
          <p className="text-muted-foreground text-xs">{`Older than ${SOP_REVIEW_DUE_DAYS} days`}</p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <BookOpenText size={16} />
            Document sections
          </div>
          <p className="text-foreground text-2xl font-semibold">{sections.length}</p>
          <p className="text-muted-foreground text-xs">SOP coverage by sections/ownership</p>
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge label="Runtime slice" variant="blue" />
          <p className="text-muted-foreground text-sm">
            Process Templates / Runs persistence remains a deeper phase; this screen now provides
            live SOP library and review queue using Documents data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/documents"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Open Documents Library
          </Link>
          <Link
            href="/tasks"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Open Tasks (for process runs)
          </Link>
          <Link
            href="/my-company/team"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Open Team Ownership
          </Link>
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">SOP Library (search: &quot;sop&quot;)</h2>
          {loading ? <span className="text-muted-foreground text-xs">Loading…</span> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Section</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Updated</th>
                <th className="px-4 py-2 text-left">Review</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((row) => {
                const ageDays = daysFromNow(row.updatedAt);
                const inQueue = ageDays >= SOP_REVIEW_DUE_DAYS;
                return (
                  <tr key={row.id} className="border-border border-t">
                    <td className="px-4 py-2">{row.title}</td>
                    <td className="px-4 py-2">{row.section.name}</td>
                    <td className="px-4 py-2">
                      <StatusBadge
                        label={row.status}
                        variant={row.status === 'PUBLISHED' ? 'green' : 'gray'}
                      />
                    </td>
                    <td className="px-4 py-2">{new Date(row.updatedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <StatusBadge
                        label={inQueue ? 'Review due' : 'Fresh'}
                        variant={inQueue ? 'amber' : 'blue'}
                      />
                    </td>
                  </tr>
                );
              })}
              {!loading && docs.length === 0 ? (
                <tr>
                  <td className="text-muted-foreground px-4 py-6 text-center" colSpan={5}>
                    No SOP-like documents found. Create SOP docs in Documents section.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
