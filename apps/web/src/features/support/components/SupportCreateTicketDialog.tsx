'use client';

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
import {
  TICKET_CATEGORIES,
  TICKET_COVERAGE_DECISIONS,
  TICKET_PRIORITIES,
} from '@/features/support/constants/support';
import type { Project, ProjectProductSummary } from '@/lib/api/projects';
import type { Contact } from '@/lib/api/clients';

export interface SupportCreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  productOptions: ProjectProductSummary[];
  contacts: Contact[];
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
    projects,
    productOptions,
    contacts,
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
          <div className="space-y-1">
            <Label htmlFor="support-new-project">Project</Label>
            <select
              id="support-new-project"
              className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
              value={projectId}
              onChange={(event) => onProjectIdChange(event.target.value)}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="support-new-product">Product (optional)</Label>
            <select
              id="support-new-product"
              className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
              value={productId}
              onChange={(event) => onProductIdChange(event.target.value)}
              disabled={!projectId}
            >
              <option value="">None</option>
              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
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
          <div className="space-y-1">
            <Label htmlFor="support-new-contact">Contact (optional)</Label>
            <select
              id="support-new-contact"
              className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
              value={contactId}
              onChange={(event) => onContactIdChange(event.target.value)}
            >
              <option value="">None</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                </option>
              ))}
            </select>
          </div>
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
