'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { AI_ADMIN_BASE_PATH } from '../constants';

export function InternalAgentCreateDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const agent = await aiAdminApi.createInternalAgent({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      props.onCreated();
      props.onOpenChange(false);
      setName('');
      setDescription('');
      router.push(`${AI_ADMIN_BASE_PATH}/internal-agents/${agent.id}`);
    } catch {
      toast.error('Internal Agent could not be created.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Internal Agent</DialogTitle>
          <DialogDescription>
            Created in DRAFT. Assign a production Model Policy before activate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="internal-name">Name</Label>
            <Input
              id="internal-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="internal-purpose">Purpose</Label>
            <Textarea
              id="internal-purpose"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!name.trim() || submitting} onClick={() => void submit()}>
            Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
