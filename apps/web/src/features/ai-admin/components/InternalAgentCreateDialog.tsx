'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreateFormDialog, InlineField } from '@/components/shared';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { AI_ADMIN_BASE_PATH } from '../constants';

export function InternalAgentCreateDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  return <InternalAgentCreateDialogSession key={props.open ? 'open' : 'closed'} {...props} />;
}

function InternalAgentCreateDialogSession({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Internal Agent"
      description="Created in DRAFT. Assign a production Model Policy before activate."
      submitting={submitting}
      canSubmit={Boolean(name.trim()) && !submitting}
      submitLabel="Create draft"
      submittingLabel="Creating..."
      cancelLabel="Cancel"
      onSubmit={(event) =>
        void submitInternalAgent({
          event,
          name,
          description,
          setSubmitting,
          onCreated,
          onOpenChange,
          router,
        })
      }
    >
      <InlineField
        variant="controlled"
        label="Name"
        type="text"
        value={name}
        onValueChange={setName}
      />
      <InlineField
        variant="controlled"
        label="Purpose"
        type="textarea"
        value={description}
        onValueChange={setDescription}
      />
    </CreateFormDialog>
  );
}

async function submitInternalAgent(options: {
  event: FormEvent;
  name: string;
  description: string;
  setSubmitting: (submitting: boolean) => void;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
  router: ReturnType<typeof useRouter>;
}): Promise<void> {
  options.event.preventDefault();
  options.setSubmitting(true);
  try {
    const agent = await aiAdminApi.createInternalAgent({
      name: options.name.trim(),
      description: options.description.trim() || undefined,
    });
    options.onCreated();
    options.onOpenChange(false);
    options.router.push(`${AI_ADMIN_BASE_PATH}/internal-agents/${agent.id}`);
  } catch {
    toast.error('Internal Agent could not be created.');
  } finally {
    options.setSubmitting(false);
  }
}
