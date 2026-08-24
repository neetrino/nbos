'use client';

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentClientSetupCopy } from '../use-agent-client-setup-copy';

export function AgentClientSetupActions(props: {
  token: string | null;
  apiOrigin: string;
  includeEnv?: boolean;
}) {
  const setup = useAgentClientSetupCopy(props.token, props.apiOrigin);
  const copyEnv = props.includeEnv ? setup.copyEnv : null;

  return (
    <div className="flex flex-wrap gap-2">
      {copyEnv ? (
        <Button type="button" size="sm" onClick={copyEnv}>
          <Copy className="size-3.5" aria-hidden />
          Copy .env
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant={copyEnv ? 'outline' : 'default'}
        onClick={setup.copyMcp}
      >
        <Copy className="size-3.5" aria-hidden />
        Copy MCP config
      </Button>
    </div>
  );
}

export function AgentClientSetupSection(props: { token: string | null; apiOrigin: string }) {
  const setup = useAgentClientSetupCopy(props.token, props.apiOrigin);

  return (
    <div className="border-border mt-4 space-y-3 border-t pt-4">
      <div>
        <h3 className="text-sm font-semibold">Connect client</h3>
        <p className="text-muted-foreground text-xs">
          Copy .env appears when you Issue or Rotate a token. MCP can be copied here anytime.
        </p>
      </div>
      <dl className="grid gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground font-medium">REST API</dt>
          <dd className="font-mono break-all">{setup.restUrl}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-medium">MCP</dt>
          <dd className="font-mono break-all">{setup.mcpUrl}</dd>
        </div>
      </dl>
      <AgentClientSetupActions token={props.token} apiOrigin={props.apiOrigin} />
    </div>
  );
}
