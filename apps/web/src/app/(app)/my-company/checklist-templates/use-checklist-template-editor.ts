'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  checklistTemplatesApi,
  parseChecklistTemplateItems,
  type ChecklistTemplateDetail,
  type ChecklistTemplateItem,
} from '@/lib/api/checklist-templates';

export function useChecklistTemplateEditor(templateId: string | null) {
  const [detail, setDetail] = useState<ChecklistTemplateDetail | null>(null);
  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!templateId) {
      setDetail(null);
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const row = await checklistTemplatesApi.getById(templateId);
      setDetail(row);
      setItems(parseChecklistTemplateItems(row.draftVersion?.items));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load template');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveDraft = useCallback(async () => {
    if (!templateId || !detail || detail.status === 'ARCHIVED') return;
    setSaving(true);
    try {
      const next = await checklistTemplatesApi.updateDraftItems(
        templateId,
        items.map((row, index) => ({ ...row, sortOrder: index })),
      );
      setDetail(next);
      setItems(parseChecklistTemplateItems(next.draftVersion?.items));
      toast.success('Draft saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }, [templateId, detail, items]);

  const publish = useCallback(async () => {
    if (!templateId || !detail || detail.status === 'ARCHIVED') return;
    setPublishing(true);
    try {
      const next = await checklistTemplatesApi.publish(templateId);
      setDetail(next);
      setItems(parseChecklistTemplateItems(next.draftVersion?.items));
      toast.success('Version published');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  }, [templateId, detail]);

  const archive = useCallback(async () => {
    if (!templateId || !detail || detail.status === 'ARCHIVED') return;
    setSaving(true);
    try {
      setDetail(await checklistTemplatesApi.archive(templateId));
      toast.success('Template archived');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive');
    } finally {
      setSaving(false);
    }
  }, [templateId, detail]);

  return {
    detail,
    setDetail,
    items,
    setItems,
    loading,
    saving,
    publishing,
    saveDraft,
    publish,
    archive,
  };
}
