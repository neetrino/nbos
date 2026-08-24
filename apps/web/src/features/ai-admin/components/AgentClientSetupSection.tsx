'use client';

import { ChevronDown, Copy, PlugZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { AI_ADMIN_ICON_ACCENT_CLASS } from '../ai-admin-ui.constants';
import { useAgentClientSetupCopy } from '../use-agent-client-setup-copy';

type SetupCopy = ReturnType<typeof useAgentClientSetupCopy>;

export function AgentClientSetupActions(props: { token: string | null; apiOrigin: string }) {
  const setup = useAgentClientSetupCopy(props.token, props.apiOrigin);

  return (
    <div className="flex flex-wrap gap-2">
      {setup.copyEnv ? (
        <Button type="button" size="sm" variant="outline" onClick={setup.copyEnv}>
          <Copy className="size-3.5" aria-hidden />
          Copy .env
        </Button>
      ) : null}
      <Button type="button" size="sm" onClick={setup.copyMcp}>
        <PlugZap className="size-3.5" aria-hidden />
        Copy MCP config
      </Button>
    </div>
  );
}

export function AgentClientSetupSection(props: { token: string | null; apiOrigin: string }) {
  const setup = useAgentClientSetupCopy(props.token, props.apiOrigin);

  return (
    <div className="border-border mt-3 border-t pt-3">
      <McpConnectSplitButton setup={setup} />
    </div>
  );
}

function McpConnectSplitButton(props: { setup: SetupCopy }) {
  const { setup } = props;

  return (
    <div className="flex w-full overflow-hidden rounded-xl border border-teal-500/30 bg-teal-500/10">
      <button
        type="button"
        onClick={setup.copyMcp}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-teal-500/15"
      >
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/15',
            AI_ADMIN_ICON_ACCENT_CLASS,
          )}
        >
          <PlugZap className="size-6" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-base leading-none font-semibold text-teal-950 dark:text-teal-50">
            MCP
          </span>
          <span className="text-muted-foreground mt-1.5 block text-xs">Copy config</span>
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={(triggerProps) => (
            <button
              {...triggerProps}
              type="button"
              aria-label="Connect client options"
              className={cn(
                'flex w-11 shrink-0 items-center justify-center border-l border-teal-500/30 transition-colors hover:bg-teal-500/15',
                triggerProps.className,
              )}
            >
              <ChevronDown className="size-5 text-teal-800 dark:text-teal-200" aria-hidden />
            </button>
          )}
        />
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Connect client</DropdownMenuLabel>
            <div className="text-muted-foreground space-y-2 px-2 py-1.5 text-xs">
              <div>
                <p className="mb-0.5 font-medium">REST API</p>
                <p className="font-mono break-all">{setup.restUrl}</p>
              </div>
              <div>
                <p className="mb-0.5 flex items-center gap-1 font-semibold text-teal-800 dark:text-teal-200">
                  <PlugZap className="size-3.5" aria-hidden />
                  MCP
                </p>
                <p className="font-mono break-all">{setup.mcpUrl}</p>
              </div>
            </div>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={setup.copyMcp}>
              <PlugZap className="size-4" aria-hidden />
              Copy MCP config
            </DropdownMenuItem>
            {setup.copyEnv ? (
              <DropdownMenuItem onClick={setup.copyEnv}>
                <Copy className="size-4" aria-hidden />
                Copy .env
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
