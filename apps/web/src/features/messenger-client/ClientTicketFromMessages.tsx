'use client';

import { useState } from 'react';
import { SupportCreateTicketDialog } from '@/features/support/components/SupportCreateTicketDialog';
import { CLIENT_MESSAGE_ACTION_HOOKS } from '@/features/messenger-internal/client-message-action-hooks';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { supportApi } from '@/lib/api/support';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { ClientLinkTicketDialog } from './ClientLinkTicketDialog';

export function ClientTicketFromMessages({
  openCreate,
  openLink,
  selectedCount,
  selectedMessageIds,
  productId,
  onOpenCreateChange,
  onOpenLinkChange,
  onAttached,
}: {
  openCreate: boolean;
  openLink: boolean;
  selectedCount: number;
  selectedMessageIds: string[];
  productId: string | null;
  onOpenCreateChange: (open: boolean) => void;
  onOpenLinkChange: (open: boolean) => void;
  onAttached: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  if (!CLIENT_MESSAGE_ACTION_HOOKS.createTicket) return null;
  return (
    <>
      <ClientCreateTicketDialog
        open={openCreate}
        productId={productId}
        selectedCount={selectedCount}
        submitting={submitting}
        onOpenChange={onOpenCreateChange}
        onSubmit={(draft) =>
          void submitCreateTicket({
            ...draft,
            productId,
            selectedMessageIds,
            setSubmitting,
            onOpenCreateChange,
            onAttached,
          })
        }
      />
      <ClientLinkTicketDialog
        open={openLink}
        onClose={() => onOpenLinkChange(false)}
        submitting={submitting}
        onSubmit={(ticketId) =>
          void submitLinkTicket({
            ticketId,
            selectedMessageIds,
            setSubmitting,
            onOpenLinkChange,
            onAttached,
          })
        }
      />
    </>
  );
}

function ClientCreateTicketDialog({
  open,
  productId,
  selectedCount,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  productId: string | null;
  selectedCount: number;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: {
    title: string;
    description: string;
    category: string;
    priority: string;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UNCLASSIFIED');
  const [priority, setPriority] = useState('P3');
  return (
    <>
      <SupportCreateTicketDialog
        open={open}
        onOpenChange={onOpenChange}
        dialogTitle="Create support ticket from messages"
        title={title}
        projectId=""
        productId={productId ?? ''}
        category={category}
        priority={priority}
        description={description}
        onTitleChange={setTitle}
        onProjectIdChange={() => undefined}
        onProductIdChange={() => undefined}
        onCategoryChange={setCategory}
        onPriorityChange={setPriority}
        onDescriptionChange={setDescription}
        submitting={submitting}
        onSubmit={() => onSubmit({ title, description, category, priority })}
      />
      <p className="sr-only">Creating a Ticket from {selectedCount} messages.</p>
    </>
  );
}

async function submitCreateTicket(input: {
  title: string;
  description: string;
  category: string;
  priority: string;
  productId: string | null;
  selectedMessageIds: string[];
  setSubmitting: (value: boolean) => void;
  onOpenCreateChange: (open: boolean) => void;
  onAttached: () => void;
}): Promise<void> {
  const title = input.title.trim();
  if (!title) {
    toast.error('Title is required to create a ticket.');
    return;
  }
  input.setSubmitting(true);
  try {
    const ticket = await supportApi.create({
      title,
      productId: input.productId ?? undefined,
      category: input.category,
      priority: input.priority,
      description: input.description.trim() || undefined,
    });
    await messengerCoreApi.attachTicketSources(input.selectedMessageIds, ticket.id);
    toast.success('Ticket created with source references');
    input.onOpenCreateChange(false);
    input.onAttached();
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Ticket could not be created from messages.'));
  } finally {
    input.setSubmitting(false);
  }
}

async function submitLinkTicket(input: {
  ticketId: string;
  selectedMessageIds: string[];
  setSubmitting: (value: boolean) => void;
  onOpenLinkChange: (open: boolean) => void;
  onAttached: () => void;
}): Promise<void> {
  input.setSubmitting(true);
  try {
    await messengerCoreApi.attachTicketSources(input.selectedMessageIds, input.ticketId);
    toast.success('Ticket linked to source messages');
    input.onOpenLinkChange(false);
    input.onAttached();
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Ticket could not be linked.'));
  } finally {
    input.setSubmitting(false);
  }
}
