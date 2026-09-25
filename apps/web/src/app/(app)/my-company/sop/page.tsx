'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, BookOpenText, RefreshCw } from 'lucide-react';
import { StatusBadge, useModuleHeroSlots } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { CompanyStatCard } from '@/features/hr/components/MyCompanyHubCards';
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

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewQueue = useMemo(
    () => docs.filter((row) => row.updatedAt && daysFromNow(row.updatedAt) >= SOP_REVIEW_DUE_DAYS),
    [docs],
  );

  const trailing = useMemo(
    () => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void load()}
        disabled={loading}
      >
        <RefreshCw size={14} aria-hidden />
        Refresh
      </Button>
    ),
    [load, loading],
  );
  const slots = useMemo(() => ({ trailing }), [trailing]);
  useModuleHeroSlots(slots);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        SOP library from Documents: what needs review, which sections are covered, and who owns the
        process.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        <CompanyStatCard
          icon={<BookOpenText size={16} aria-hidden />}
          label="SOP documents"
          value={String(docs.length)}
          helper="Search “sop” in Documents"
        />
        <CompanyStatCard
          icon={<ClipboardList size={16} aria-hidden />}
          label="Review queue"
          value={String(reviewQueue.length)}
          helper={`Older than ${SOP_REVIEW_DUE_DAYS} days`}
        />
        <CompanyStatCard
          icon={<BookOpenText size={16} aria-hidden />}
          label="Sections"
          value={String(sections.length)}
          helper="Coverage by ownership"
        />
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge label="Runtime slice" variant="blue" />
          <p className="text-muted-foreground text-sm">
            Process Templates / Runs persistence remains a deeper phase; this screen now provides
            live SOP library and review queue using Documents data.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ['/my-company/checklist-templates', 'Checklist templates'],
              ['/documents', 'Documents'],
              ['/tasks', 'Tasks'],
              ['/my-company/team', 'Team'],
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="border-border hover:border-primary/40 rounded-xl border px-3 py-2 text-sm font-medium"
            >
              {label}
            </Link>
          ))}
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
                    <td className="px-4 py-2">{row.section?.name ?? '—'}</td>
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
