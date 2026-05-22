'use client';

import { useEffect, useState } from 'react';
import { FolderKanban, Layers, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RelationPickerField } from '@/components/shared';
import {
  useContactRelationSearch,
  useProductRelationSearch,
  useProjectRelationSearch,
} from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import {
  TICKET_CATEGORIES,
  TICKET_COVERAGE_DECISIONS,
  TICKET_PRIORITIES,
} from '@/features/support/constants/support';

export interface SupportCreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  projectId: string;
  productId: string;
  category: string;
  priority: string;
  description: string;
  coverageDecision: string;
  contactId: string;
  onTitleChange: (value: string) => void;
  onProjectIdChange: (value: string) => void;
  onProductIdChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCoverageDecisionChange: (value: string) => void;
  onContactIdChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function SupportCreateTicketDialog(props: SupportCreateTicketDialogProps) {
  const {
    open,
    onOpenChange,
    title,
    projectId,
    productId,
    category,
    priority,
    description,
    coverageDecision,
    contactId,
    onTitleChange,
    onProjectIdChange,
    onProductIdChange,
    onCategoryChange,
    onPriorityChange,
    onDescriptionChange,
    onCoverageDecisionChange,
    onContactIdChange,
    onSubmit,
    submitting,
  } = props;

  const [projectLabel, setProjectLabel] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [contactLabel, setContactLabel] = useState('');

  const searchProjects = useProjectRelationSearch();
  const searchProducts = useProductRelationSearch(projectId || null);
  const searchContacts = useContactRelationSearch();
  const projectPicker = useRelationPickerActions('project');
  const productPicker = useRelationPickerActions('product');
  const contactPicker = useRelationPickerActions('contact');

  useEffect(() => {
    if (!projectId) setProjectLabel('');
  }, [projectId]);

  useEffect(() => {
    if (!productId) setProductLabel('');
  }, [productId]);

  useEffect(() => {
    if (!contactId) setContactLabel('');
  }, [contactId]);

  useEffect(() => {
    if (!projectId) {
      onProductIdChange('');
      setProductLabel('');
    }
  }, [projectId, onProductIdChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New support ticket</DialogTitle>
          <DialogDescription>
            Pick a project and optional product. Product also drives filters and technical linking.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="support-new-title">Title</Label>
            <Input
              id="support-new-title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Short description of the issue"
            />
          </div>
          <RelationPickerField
            label="Project"
            entityKind="project"
            value={projectId || null}
            selectionLabel={projectLabel || null}
            placeholder="Search projects…"
            icon={<FolderKanban size={12} />}
            onSearch={searchProjects}
            onSelect={(id, label) => {
              onProjectIdChange(id);
              setProjectLabel(label);
            }}
            {...projectPicker}
          />
          <RelationPickerField
            label="Product"
            entityKind="product"
            value={productId || null}
            selectionLabel={productLabel || null}
            placeholder={projectId ? 'Search products…' : 'Select a project first'}
            icon={<Layers size={12} />}
            disabled={!projectId}
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
          <div className="space-y-1">
            <Label htmlFor="support-new-desc">Description (optional)</Label>
            <Textarea
              id="support-new-desc"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="support-new-coverage">Coverage (optional)</Label>
            <select
              id="support-new-coverage"
              className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
              value={coverageDecision}
              onChange={(event) => onCoverageDecisionChange(event.target.value)}
            >
              <option value="">Decide later</option>
              {TICKET_COVERAGE_DECISIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <RelationPickerField
            label="Contact"
            entityKind="contact"
            value={contactId || null}
            selectionLabel={contactLabel || null}
            placeholder="Search contacts…"
            icon={<User size={12} />}
            onSearch={searchContacts}
            onSelect={(id, label) => {
              onContactIdChange(id);
              setContactLabel(label);
            }}
            onClear={() => {
              onContactIdChange('');
              setContactLabel('');
            }}
            {...contactPicker}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void onSubmit()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
