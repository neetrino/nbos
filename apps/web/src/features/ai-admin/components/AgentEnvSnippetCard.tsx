'use client';

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AgentEnvSnippetCard(props: { snippet: string; onCopy: () => void }) {
  const lines = props.snippet.trimEnd().split('\n');

  return (
    <div className="border-border bg-muted overflow-hidden rounded-lg border">
      <div className="border-border flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-muted-foreground text-xs font-medium">.env</span>
        <Button type="button" size="sm" variant="ghost" onClick={props.onCopy}>
          <Copy className="size-3.5" aria-hidden />
          Copy
        </Button>
      </div>
      <div className="flex flex-col gap-3 overflow-x-auto p-3 font-mono text-xs leading-6">
        {lines.map((line, index) => (
          <div key={line} className="flex items-start gap-3">
            <span className="text-muted-foreground w-4 shrink-0 pt-px text-right select-none">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 break-all whitespace-pre-wrap">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
