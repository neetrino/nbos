'use client';

import { useState } from 'react';
import { FolderKanban, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RelationPickerField } from '@/components/shared';
import {
  useProductRelationSearch,
  useProjectRelationSearch,
} from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '@/features/support/constants/support';

export interface SupportCreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTitle?: string;
  submitLabel?: string;
  title: string;
  projectId: string;
  productId: string;
  category: string;
  priority: string;
  description: string;
  onTitleChange: (value: string) => void;
  onProjectIdChange: (value: string) => void;
  onProductIdChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  forceNestedBackdrop?: boolean;
}

export function SupportCreateTicketDialog({
  open,
  onOpenChange,
  dialogTitle = 'New support ticket',
  submitLabel = 'Create',
  title,
  projectId,
  productId,
  category,
  priority,
  description,
  onTitleChange,
  onProjectIdChange,
  onProductIdChange,
  onCategoryChange,
  onPriorityChange,
  onDescriptionChange,
  onSubmit,
  submitting,
  forceNestedBackdrop = false,
}: SupportCreateTicketDialogProps) {
  const [projectLabel, setProjectLabel] = useState('');
  const [productLabel, setProductLabel] = useState('');

  const searchProjects = useProjectRelationSearch();
  const searchProducts = useProductRelationSearch(projectId || null);
  const projectPicker = useRelationPickerActions('project');
  const productPicker = useRelationPickerActions('product');

  const projectSelectionLabel = projectId ? projectLabel || null : null;
  const productSelectionLabel = productId ? productLabel || null : null;
  const canSubmit = title.trim().length > 0 && !submitting;

  const clearProjectSelection = () => {
    onProjectIdChange('');
    setProjectLabel('');
    onProductIdChange('');
    setProductLabel('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="support-new-title">Title *</Label>
            <Input
              id="support-new-title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Short description of the issue or request"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="support-new-category">Category</Label>
              <select
                id="support-new-category"
                className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                value={category}
                onChange={(event) => onCategoryChange(event.target.value)}
              >
                {TICKET_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="support-new-priority">Priority</Label>
              <select
                id="support-new-priority"
                className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                value={priority}
                onChange={(event) => onPriorityChange(event.target.value)}
              >
                {TICKET_PRIORITIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <RelationPickerField
            label="Project"
            entityKind="project"
            value={projectId || null}
            selectionLabel={projectSelectionLabel}
            placeholder="Search projects…"
            icon={<FolderKanban size={12} />}
            onSearch={searchProjects}
            onSelect={(id, label) => {
              if (!id) {
                clearProjectSelection();
                return;
              }
              onProjectIdChange(id);
              setProjectLabel(label);
            }}
            onClear={clearProjectSelection}
            {...projectPicker}
          />
          {projectId ? (
            <RelationPickerField
              label="Product"
              entityKind="product"
              value={productId || null}
              selectionLabel={productSelectionLabel}
              placeholder="Search products…"
              icon={<Layers size={12} />}
              onSearch={searchProducts}
              onSelect={(id, label) => {
                onProductIdChange(id);
                setProductLabel(label);
              }}
              onClear={() => {
                onProductIdChange('');
                setProductLabel('');
              }}
              {...productPicker}
            />
          ) : null}
          <div className="space-y-1">
            <Label htmlFor="support-new-desc">Description</Label>
            <Textarea
              id="support-new-desc"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => void onSubmit()}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
