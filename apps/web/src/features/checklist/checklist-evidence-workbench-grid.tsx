'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Film,
  Image as ImageIcon,
  KeyRound,
  Link2,
  ListTodo,
  Loader2,
  Type,
} from 'lucide-react';
import {
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES,
  type ChecklistTemplateItemEvidenceType,
} from '@/lib/api/checklist-templates';
import { driveApi } from '@/lib/api/drive';
import {
  CHECKLIST_EVIDENCE_UPLOAD_TYPES,
  isHttpUrlString,
  parseChecklistEvidenceFileAssetIds,
} from '@/features/checklist/checklist-evidence-value';
import { formatWorkbenchLinkDisplayLabel } from '@/features/checklist/checklist-evidence-link-label';

/** Responsive columns: more columns = smaller square tiles (fits wide checklist drawer). */
const WORKBENCH_EVIDENCE_GRID_CLASS =
  'grid w-full gap-1 grid-cols-6 sm:grid-cols-8 xl:grid-cols-10';

/** Single HTTP evidence rows are not in the tile grid; keep height intrinsic (no full-width square). */
const WORKBENCH_COMPACT_LINK_BTN_CLASS =
  'border-border bg-muted/25 text-foreground/90 hover:bg-muted/45 hover:text-foreground inline-flex h-7 w-max min-w-0 max-w-[min(100%,18rem)] shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium leading-none tracking-tight shadow-sm transition-colors';

type EvidenceFields = {
  evidenceType: ChecklistTemplateItemEvidenceType;
  evidenceValue: string | null;
  evidenceLabel: string | null;
};

function evidenceHintGlyph(type: ChecklistTemplateItemEvidenceType) {
  switch (type) {
    case 'URL':
    case 'VIDEO_LINK':
      return <Link2 className="size-3.5 shrink-0 opacity-80" aria-hidden />;
    case 'IMAGE_LINK':
      return <ImageIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />;
    case 'FILE_LINK':
    case 'DOCUMENT_LINK':
      return <FileText className="size-3.5 shrink-0 opacity-80" aria-hidden />;
    case 'CREDENTIAL_LINK':
      return <KeyRound className="size-3.5 shrink-0 opacity-80" aria-hidden />;
    case 'TASK_LINK':
      return <ListTodo className="size-3.5 shrink-0 opacity-80" aria-hidden />;
    case 'FREE_TEXT':
      return <Type className="size-3.5 shrink-0 opacity-80" aria-hidden />;
    default:
      return <FileText className="size-3.5 shrink-0 opacity-80" aria-hidden />;
  }
}

/** Minimal icons for collapsed row (no network). */
export function ChecklistEvidenceCollapsedHints({ item }: { item: EvidenceFields }) {
  if (item.evidenceType === 'TEXT_ONLY' || !item.evidenceValue?.trim()) {
    return null;
  }

  const raw = item.evidenceValue.trim();

  if (CHECKLIST_EVIDENCE_UPLOAD_TYPES.has(item.evidenceType)) {
    const n = parseChecklistEvidenceFileAssetIds(raw).length;
    if (n === 0) return null;
    return (
      <span
        className="text-muted-foreground inline-flex items-center gap-0.5"
        title={`${n} attachment${n === 1 ? '' : 's'}`}
      >
        {evidenceHintGlyph(item.evidenceType)}
        {n > 1 ? (
          <span className="text-[10px] font-medium tabular-nums opacity-90">{n}</span>
        ) : null}
      </span>
    );
  }

  if (
    CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES.has(item.evidenceType) &&
    isHttpUrlString(raw)
  ) {
    return (
      <span className="text-muted-foreground inline-flex" title="Link">
        {evidenceHintGlyph(item.evidenceType)}
      </span>
    );
  }

  if (item.evidenceType === 'FREE_TEXT') {
    return (
      <span className="text-muted-foreground inline-flex" title="Text">
        {evidenceHintGlyph('FREE_TEXT')}
      </span>
    );
  }

  return (
    <span className="text-muted-foreground inline-flex">
      {evidenceHintGlyph(item.evidenceType)}
    </span>
  );
}

function FileEvidenceCell({ fileAssetId }: { fileAssetId: string }) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'err'>('loading');
  const [title, setTitle] = useState('');
  const [href, setHref] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [asset, preview] = await Promise.all([
          driveApi.getFileAsset(fileAssetId),
          driveApi.getFileAssetPreviewUrl(fileAssetId),
        ]);
        if (cancelled) return;
        const display = asset.displayName || asset.originalName || fileAssetId;
        setTitle(display);
        setHref(preview.url);
        setIsImage(Boolean(asset.mimeType?.startsWith('image/')));
        setPhase('ready');
      } catch {
        if (!cancelled) setPhase('err');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileAssetId]);

  if (phase === 'loading') {
    return (
      <div className="bg-muted/40 flex aspect-square w-full min-w-0 items-center justify-center rounded-md">
        <Loader2 className="text-muted-foreground size-3.5 animate-spin" aria-hidden />
      </div>
    );
  }

  if (phase === 'err' || !href) {
    return (
      <div className="bg-muted/30 flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-1">
        <FileText className="text-muted-foreground size-4 shrink-0 opacity-60" aria-hidden />
        <span className="text-muted-foreground line-clamp-2 max-w-full text-center text-[8px] leading-tight">
          {title || fileAssetId.slice(0, 6)}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="border-border bg-muted/20 hover:bg-muted/40 group relative aspect-square w-full min-w-0 overflow-hidden rounded-md border transition-colors"
      title={title}
    >
      {isImage ? (
        <span
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${href.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`,
          }}
          aria-hidden
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1">
          <FileText className="text-muted-foreground group-hover:text-foreground size-[1.35rem] shrink-0 transition-colors" />
          <span className="text-muted-foreground group-hover:text-foreground line-clamp-2 max-w-full px-0.5 text-center text-[8px] leading-tight">
            {title}
          </span>
        </div>
      )}
    </Link>
  );
}

function HttpLinkEvidenceButton({
  href,
  evidenceType,
}: {
  href: string;
  evidenceType: ChecklistTemplateItemEvidenceType;
}) {
  const label = formatWorkbenchLinkDisplayLabel(href);
  let icon = <Link2 className="text-muted-foreground size-3.5 shrink-0" aria-hidden />;

  switch (evidenceType) {
    case 'IMAGE_LINK':
      icon = <ImageIcon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />;
      break;
    case 'FILE_LINK':
    case 'DOCUMENT_LINK':
      icon = <FileText className="text-muted-foreground size-3.5 shrink-0" aria-hidden />;
      break;
    case 'CREDENTIAL_LINK':
      icon = <KeyRound className="text-muted-foreground size-3.5 shrink-0" aria-hidden />;
      break;
    case 'TASK_LINK':
      icon = <ListTodo className="text-muted-foreground size-3.5 shrink-0" aria-hidden />;
      break;
    case 'URL':
    default:
      break;
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={WORKBENCH_COMPACT_LINK_BTN_CLASS}
      title={href}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}

/** Expanded attachments: dense square tile grid (8–10 columns on wide layouts). */
export function ChecklistEvidenceWorkbenchGrid({ item }: { item: EvidenceFields }) {
  if (item.evidenceType === 'TEXT_ONLY' || !item.evidenceValue?.trim()) {
    return null;
  }

  const raw = item.evidenceValue.trim();

  if (CHECKLIST_EVIDENCE_UPLOAD_TYPES.has(item.evidenceType)) {
    const ids = parseChecklistEvidenceFileAssetIds(raw);
    if (ids.length === 0) return null;
    return (
      <div className={WORKBENCH_EVIDENCE_GRID_CLASS}>
        {ids.map((id) => (
          <FileEvidenceCell key={id} fileAssetId={id} />
        ))}
      </div>
    );
  }

  if (
    CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES.has(item.evidenceType) &&
    isHttpUrlString(raw)
  ) {
    const href = raw.trim();
    if (item.evidenceType === 'VIDEO_LINK') {
      return (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={WORKBENCH_COMPACT_LINK_BTN_CLASS}
          title={href}
        >
          <Film className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{formatWorkbenchLinkDisplayLabel(href)}</span>
        </Link>
      );
    }
    return <HttpLinkEvidenceButton href={href} evidenceType={item.evidenceType} />;
  }

  if (item.evidenceType === 'FREE_TEXT') {
    return (
      <p className="text-muted-foreground max-h-24 overflow-y-auto rounded-md border border-dashed px-2 py-1.5 font-mono text-[11px] leading-snug whitespace-pre-wrap">
        {raw}
      </p>
    );
  }

  return (
    <p className="text-muted-foreground font-mono text-[11px] leading-snug break-all">{raw}</p>
  );
}
