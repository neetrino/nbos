import type { CredentialDetail } from '@/lib/api/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export interface CredentialFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialId?: string | null;
  /** Cached list row for the opened credential; enables instant render before detail loads. */
  initialItem?: CredentialListItem | null;
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
  /** Keep sheet open and show edit tabs after create (vault). Default false. */
  continueAfterCreate?: boolean;
  onCreated?: (credential: CredentialDetail) => void;
  onSaved?: () => void;
  onRequestArchive?: (id: string, name: string) => void;
}
