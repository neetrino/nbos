import { FolderKanban, KeyRound, Lock, User, Users } from 'lucide-react';
import type { PageHeroTabOption } from '@/components/shared';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export const CREDENTIAL_VAULT_TAB_OPTIONS: PageHeroTabOption<CredentialVaultScope>[] = [
  { value: 'all', label: 'All', icon: KeyRound },
  { value: 'my', label: 'My', icon: User },
  { value: 'team', label: 'Team', icon: Users },
  { value: 'project', label: 'Project', icon: FolderKanban },
  { value: 'secret', label: 'Secret', icon: Lock },
];
