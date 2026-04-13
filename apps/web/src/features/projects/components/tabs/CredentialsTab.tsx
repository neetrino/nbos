'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import type { ProjectCredential } from '@/lib/api/projects';

interface CredentialsTabProps {
  credentials: ProjectCredential[];
}

const ACCESS_LEVEL_MAP: Record<
  string,
  { label: string; variant: 'red' | 'blue' | 'purple' | 'green' }
> = {
  SECRET: { label: 'Secret', variant: 'red' },
  PROJECT_TEAM: { label: 'Team', variant: 'blue' },
  DEPARTMENT: { label: 'Dept', variant: 'purple' },
  ALL: { label: 'All', variant: 'green' },
};

const CATEGORY_ICONS: Record<string, string> = {
  ADMIN: '🔑',
  DOMAIN: '🌐',
  HOSTING: '🖥️',
  SERVICE: '⚙️',
  APP: '📱',
  MAIL: '📧',
  API_KEY: '🔒',
  DATABASE: '🗄️',
};

function MaskedField({ value }: { value: string | null }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-muted-foreground">—</span>;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs">{visible ? value : '••••••••'}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setVisible(!visible)}
        className="h-5 w-5"
      >
        {visible ? <EyeOff size={10} /> : <Eye size={10} />}
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={handleCopy} className="h-5 w-5">
        {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
      </Button>
    </div>
  );
}

export function CredentialsTab({ credentials }: CredentialsTabProps) {
  if (credentials.length === 0) {
    return <p className="text-muted-foreground text-sm">No credentials stored</p>;
  }

  return (
    <div className="space-y-3">
      {credentials.map((cred) => {
        const access = ACCESS_LEVEL_MAP[cred.accessLevel];
        return (
          <div key={cred.id} className="bg-card border-border rounded-xl border p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{CATEGORY_ICONS[cred.category] ?? '🔐'}</span>
                <div>
                  <p className="text-sm font-medium">{cred.name}</p>
                  {cred.provider && (
                    <p className="text-muted-foreground text-xs">{cred.provider}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {access && <StatusBadge label={access.label} variant={access.variant} />}
                {cred.url && (
                  <a href={cred.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink
                      size={14}
                      className="text-muted-foreground hover:text-foreground"
                    />
                  </a>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Login</span>
              <MaskedField value={cred.login} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
