'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

const EVIDENCE_SUMMARY: Record<ChecklistTemplateItemEvidenceType, string> = {
  TEXT_ONLY: '',
  URL: 'Link',
  FILE_LINK: 'File',
  IMAGE_LINK: 'File',
  VIDEO_LINK: 'Video link',
  DOCUMENT_LINK: 'File',
  CREDENTIAL_LINK: 'Credential link',
  TASK_LINK: 'Task link',
  FREE_TEXT: 'Free text answer',
};

type EvidenceFields = {
  evidenceType: ChecklistTemplateItemEvidenceType;
  evidenceValue: string | null;
  evidenceLabel: string | null;
};

function ResolvedDriveFileLink({ fileAssetId }: { fileAssetId: string }) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'err'>('loading');
  const [title, setTitle] = useState('');
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [asset, preview] = await Promise.all([
          driveApi.getFileAsset(fileAssetId),
          driveApi.getFileAssetPreviewUrl(fileAssetId),
        ]);
        if (cancelled) {
          return;
        }
        setTitle(asset.displayName || asset.originalName || fileAssetId);
        setHref(preview.url);
        setPhase('ready');
      } catch {
        if (!cancelled) {
          setPhase('err');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileAssetId]);

  if (phase === 'loading') {
    return <p className="text-muted-foreground text-[11px]">Loading attachment…</p>;
  }
  if (phase === 'err') {
    return <p className="font-mono text-[11px] break-all">{fileAssetId}</p>;
  }
  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-block max-w-full truncate underline-offset-2 hover:underline"
      >
        {title}
      </Link>
    );
  }
  return <p className="text-[11px]">{title}</p>;
}

function EvidenceLinkingBody({ item }: { item: EvidenceFields }) {
  const raw = item.evidenceValue;
  if (!raw) {
    return null;
  }
  const uploadType = CHECKLIST_EVIDENCE_UPLOAD_TYPES.has(item.evidenceType);
  if (uploadType) {
    const ids = parseChecklistEvidenceFileAssetIds(raw);
    if (ids.length > 0) {
      return (
        <ul className="space-y-1.5">
          {ids.map((id) => (
            <li key={id}>
              <ResolvedDriveFileLink fileAssetId={id} />
            </li>
          ))}
        </ul>
      );
    }
  }
  if (isHttpUrlString(raw)) {
    const href = raw.trim();
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-block max-w-full truncate underline-offset-2 hover:underline"
      >
        {raw}
      </Link>
    );
  }
  return <p className="font-mono text-[11px] break-all">{raw}</p>;
}

export function ChecklistItemEvidenceDisplay({ item }: { item: EvidenceFields }) {
  if (item.evidenceType === 'TEXT_ONLY') {
    return null;
  }

  const label = EVIDENCE_SUMMARY[item.evidenceType];

  return (
    <div className="text-muted-foreground mt-2 space-y-1 border-t border-dashed pt-2 text-xs">
      <p>
        <span className="text-foreground font-medium">{label}</span>
        {item.evidenceType === 'FREE_TEXT' && item.evidenceLabel ? (
          <span className="ml-1">· {item.evidenceLabel}</span>
        ) : null}
      </p>
      {CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES.has(item.evidenceType) &&
      item.evidenceValue ? (
        <EvidenceLinkingBody item={item} />
      ) : null}
    </div>
  );
}
