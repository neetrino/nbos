'use client';

import { Eye, EyeOff, Copy, KeyRound, FolderKanban, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import {
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { credentialHealthBadge } from '@/features/credentials/utils/credential-health-badge';

export interface CredentialVaultTableRowCellsProps {
  cred: CredentialListItem;
  isLoginVisible: boolean;
  onToggleLogin: (id: string) => void;
  onCopy: (text: string) => void;
}

export function CredentialVaultTableRowCells({
  cred,
  isLoginVisible,
  onToggleLogin,
  onCopy,
}: CredentialVaultTableRowCellsProps) {
  const access = getAccessLevel(cred.accessLevel);
  const criticality = getCredentialCriticality(cred.criticality);
  const healthBadge = credentialHealthBadge(cred.health);

  return (
    <>
      <TableCell>
        <div className="flex items-center gap-2">
          <KeyRound size={14} className="text-muted-foreground" />
          <span className="font-medium">{cred.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-xs">{cred.category}</TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {cred.credentialType.replaceAll('_', ' ')}
      </TableCell>
      <TableCell>
        {criticality && <StatusBadge label={criticality.label} variant={criticality.variant} />}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{cred.provider ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="font-mono text-xs">
            {cred.login ? (isLoginVisible ? cred.login : '••••••••') : '—'}
          </span>
          {cred.login && (
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon-sm" onClick={() => onToggleLogin(cred.id)}>
                {isLoginVisible ? <EyeOff size={12} /> : <Eye size={12} />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onCopy(cred.login!)}>
                <Copy size={12} />
              </Button>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {access && (
          <div className="flex items-center gap-1">
            <Shield size={11} className="text-muted-foreground" />
            <StatusBadge label={access.label} variant={access.variant} />
          </div>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {cred.owner ? `${cred.owner.firstName} ${cred.owner.lastName}` : '—'}
      </TableCell>
      <TableCell>
        {cred.project ? (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <FolderKanban size={10} />
            {cred.project.name}
          </div>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">
            {cred.nextRotationAt ? new Date(cred.nextRotationAt).toLocaleDateString() : 'No date'}
          </span>
          {healthBadge && <StatusBadge label={healthBadge.label} variant={healthBadge.variant} />}
        </div>
      </TableCell>
    </>
  );
}
