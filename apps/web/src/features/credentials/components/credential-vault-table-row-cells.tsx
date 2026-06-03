'use client';

import { AtSign, FolderKanban, KeyRound, Lock, Shield } from 'lucide-react';
import { TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import {
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import { CredentialVaultSecretPill } from '@/features/credentials/components/credential-vault-secret-pills';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { credentialHealthBadge } from '@/features/credentials/utils/credential-health-badge';
import { formatCredentialTypeLabel } from '@/features/credentials/utils/credential-type-display';

const PASSWORD_MASK = '••••••';

export interface CredentialVaultTableRowCellsProps {
  cred: CredentialListItem;
  passwordCopied: boolean;
  onCopyLogin: (login: string) => void;
  onCopyPassword: (credentialId: string, criticality: string) => void;
}

export function CredentialVaultTableRowCells({
  cred,
  passwordCopied,
  onCopyLogin,
  onCopyPassword,
}: CredentialVaultTableRowCellsProps) {
  const access = getAccessLevel(cred.accessLevel);
  const criticality = getCredentialCriticality(cred.criticality);
  const healthBadge = credentialHealthBadge(cred.health);
  const showPassword = Boolean(cred.secretsPresent?.password);

  return (
    <>
      <TableCell>
        <div className="flex items-center gap-2">
          <KeyRound size={14} className="text-muted-foreground" />
          <span className="font-medium">{cred.name}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-[180px]" onClick={(e) => e.stopPropagation()}>
        {cred.login ? (
          <CredentialVaultSecretPill
            icon={<AtSign size={12} strokeWidth={2} />}
            value={cred.login}
            copyLabel="Copy login"
            onCopy={() => onCopyLogin(cred.login!)}
          />
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="max-w-[140px]" onClick={(e) => e.stopPropagation()}>
        {showPassword ? (
          <CredentialVaultSecretPill
            icon={<Lock size={12} strokeWidth={2} />}
            value={PASSWORD_MASK}
            copyLabel="Copy password"
            copied={passwordCopied}
            mono
            onCopy={() => onCopyPassword(cred.id, cred.criticality)}
          />
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-xs">{cred.category}</TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatCredentialTypeLabel(cred.credentialType)}
      </TableCell>
      <TableCell>
        {criticality && <StatusBadge label={criticality.label} variant={criticality.variant} />}
      </TableCell>
      <TableCell>
        {access && (
          <div className="flex items-center gap-1">
            <Shield size={11} className="text-muted-foreground" />
            <StatusBadge label={access.label} variant={access.variant} />
          </div>
        )}
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
