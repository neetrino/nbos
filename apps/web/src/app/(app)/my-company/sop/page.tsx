'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpenText, ClipboardList } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { CompanyStatCard } from '@/features/hr/components/MyCompanyHubCards';
import { documentsApi, type DocumentListItem, type DocumentSection } from '@/lib/api/documents';

const SOP_REVIEW_DUE_DAYS = 30;

function SopLibrary({ docs, loading }: { docs: DocumentListItem[]; loading: boolean }) {
  return (
    <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <BookOpenText size={15} />
          </div>
          <h2 className="text-foreground text-sm font-semibold">SOP library</h2>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {loading ? '…' : docs.length}
        </span>
      </div>
      {loading ? (
        <p className="text-muted-foreground relative mt-3 text-xs">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-muted-foreground relative mt-3 text-xs">
          No SOP documents yet. Create them in Documents.
        </p>
      ) : (
        <ul className="relative mt-3 flex flex-col gap-1">
          {docs.map((row) => (
            <SopLibraryRow key={row.id} row={row} />
          ))}
        </ul>
      )}
      <div className="relative mt-3 flex flex-wrap gap-2">
        <Link href="/documents" className="text-primary text-xs font-medium">
          Open Documents
        </Link>
      </div>
    </section>
  );
}

function SopLibraryRow({ row }: { row: DocumentListItem }) {
  const ageDays = daysFromNow(row.updatedAt);
  const inQueue = ageDays >= SOP_REVIEW_DUE_DAYS;
  return (
    <li className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {row.title.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{row.title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {row.section?.name ?? 'No section'} · {new Date(row.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <StatusBadge label={row.status} variant={row.status === 'PUBLISHED' ? 'green' : 'gray'} />
      <StatusBadge label={inQueue ? 'Review due' : 'Fresh'} variant={inQueue ? 'amber' : 'blue'} />
    </li>
  );
}

function daysFromNow(iso: string): number {
  const now = new Date();
  const then = new Date(iso);
  return Math.floor((now.getTime() - then.getTime()) / (24 * 60 * 60 * 1000));
}

export default function SopPage() {
  const t = useTranslations('hr');
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

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">{t('sopPage.intro')}</p>
      <div className="grid gap-3 sm:grid-cols-3">
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

      <SopLibrary docs={docs} loading={loading} />
    </div>
  );
}
