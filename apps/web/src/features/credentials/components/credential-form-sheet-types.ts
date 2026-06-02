import type { CredentialDetail } from '@/lib/api/credentials';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export interface CredentialFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialId?: string | null;
  vaultScope?: CredentialVaultScope;
  projectId?: string;
  productId?: string;
  title?: string;
  initialName?: string;
  initialCategory?: string;
  allowedCategories?: string[];
  initialCredentialType?: string;
  submitLabel?: string;
  successToast?: string | false;
  presetKey?: string;
  onCreated?: (credential: CredentialDetail) => void;
  onSaved?: () => void;
  onRequestArchive?: (id: string, name: string) => void;
}
