'use client';

import { useState } from 'react';
import { Copy, EyeOff } from 'lucide-react';
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

export function OneTimeSecretModal(props: {
  open: boolean;
  title: string;
  secret: string | null;
  setupHint: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const dismiss = () => {
    setCopied(false);
    props.onClose();
  };

  const copy = async () => {
    if (!props.secret) return;
    await navigator.clipboard.writeText(props.secret);
    setCopied(true);
    toast.success('Copied. Store it now — it will not be shown again.');
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="size-4" aria-hidden />
            {props.title}
          </DialogTitle>
          <DialogDescription>
            This value is shown once. After you close this dialog, NBOS only keeps a prefix.
          </DialogDescription>
        </DialogHeader>
        <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs break-all whitespace-pre-wrap">
          {props.secret ?? ''}
        </pre>
        <p className="text-muted-foreground text-xs">{props.setupHint}</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void copy()}>
            <Copy className="size-3.5" aria-hidden />
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button type="button" onClick={dismiss}>
            I have stored it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
