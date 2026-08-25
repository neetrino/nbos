'use client';

import { EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildAgentEnvSnippet } from '../agent-client-setup';
import { useAgentClientSetupCopy } from '../use-agent-client-setup-copy';
import { AgentClientSetupActions } from './AgentClientSetupSection';
import { AgentEnvSnippetCard } from './AgentEnvSnippetCard';

export function OneTimeSecretModal(props: {
  open: boolean;
  title: string;
  secret: string | null;
  apiOrigin: string;
  onClose: () => void;
}) {
  const setup = useAgentClientSetupCopy(props.secret, props.apiOrigin);
  const snippet = props.secret ? buildAgentEnvSnippet(props.secret, props.apiOrigin) : '';

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="size-4" aria-hidden />
            {props.title}
          </DialogTitle>
          <DialogDescription>
            Shown once. Paste the two .env lines, or copy MCP for Cursor / Claude / Codex.
          </DialogDescription>
        </DialogHeader>
        {snippet && setup.copyEnv ? (
          <AgentEnvSnippetCard snippet={snippet} onCopy={setup.copyEnv} />
        ) : null}
        <AgentClientSetupActions token={props.secret} apiOrigin={props.apiOrigin} />
        <DialogFooter>
          <Button type="button" onClick={props.onClose}>
            I have stored it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
