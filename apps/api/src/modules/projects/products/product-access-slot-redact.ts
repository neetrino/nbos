export type AccessSlotCredentialSecrets = {
  login: string | null;
  url: string | null;
};

export type AccessSlotBoundCredentialDto = {
  id: string;
  name: string;
  category: string;
  credentialType: string;
  login: string | null;
  url: string | null;
  canReveal: boolean;
};

export function redactAccessSlotCredential(
  credential: {
    id: string;
    name: string;
    category: string;
    credentialType: string;
  } & AccessSlotCredentialSecrets,
  canReveal: boolean,
): AccessSlotBoundCredentialDto {
  return {
    id: credential.id,
    name: credential.name,
    category: credential.category,
    credentialType: credential.credentialType,
    login: canReveal ? credential.login : null,
    url: canReveal ? credential.url : null,
    canReveal,
  };
}
