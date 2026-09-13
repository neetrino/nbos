'use client';

import { useCallback, useState } from 'react';
import type { TaskDeliveryContextOption } from '@/features/tasks/utils/search-task-delivery-context';
import { createQuickCreateChecklist } from './quick-create-checklist-draft';
import type { QuickCreateDraftChecklist, QuickCreateDraftLink } from './quick-create-task-extras';
import { encodeQuickCreateDraftLinkValue } from './quick-create-task-extras';

export function useQuickCreateTaskExtras() {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [checklists, setChecklists] = useState<QuickCreateDraftChecklist[]>([]);
  const [pickedLinks, setPickedLinks] = useState<QuickCreateDraftLink[]>([]);

  const resetExtras = useCallback(() => {
    setStagedFiles([]);
    setChecklists([]);
    setPickedLinks([]);
  }, []);

  const addFiles = useCallback((picked: File[]) => {
    if (picked.length === 0) return;
    setStagedFiles((current) => [...current, ...picked]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setStagedFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const openChecklists = useCallback(() => {
    setChecklists((current) => (current.length > 0 ? current : [createQuickCreateChecklist([])]));
  }, []);

  const selectContext = useCallback((option: TaskDeliveryContextOption) => {
    const next: QuickCreateDraftLink = {
      kind: option.kind,
      entityId: option.entityId,
      label: option.label,
      contextLabel: option.contextLabel,
    };
    setPickedLinks((current) => mergePickedLink(current, next));
  }, []);

  const unlink = useCallback((value: string) => {
    setPickedLinks((current) =>
      current.filter((link) => encodeQuickCreateDraftLinkValue(link) !== value),
    );
  }, []);

  return {
    stagedFiles,
    checklists,
    pickedLinks,
    resetExtras,
    addFiles,
    removeFile,
    setChecklists,
    openChecklists,
    selectContext,
    unlink,
  };
}

export function mergePickedLink(
  current: readonly QuickCreateDraftLink[],
  next: QuickCreateDraftLink,
): QuickCreateDraftLink[] {
  if (next.kind === 'WORK_SPACE') {
    return [...current.filter((link) => link.kind !== 'WORK_SPACE'), next];
  }
  if (
    current.some(
      (link) => encodeQuickCreateDraftLinkValue(link) === encodeQuickCreateDraftLinkValue(next),
    )
  ) {
    return [...current];
  }
  return [...current, next];
}

export function pickedWorkspaceId(links: readonly QuickCreateDraftLink[]): string | undefined {
  return links.find((link) => link.kind === 'WORK_SPACE')?.entityId;
}
