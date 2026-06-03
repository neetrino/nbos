/**
 * List projection without encrypted blobs (`password`, `apiKey`, `envData`, `secureNotes`).
 * Secret presence flags are computed in SQL via {@link loadCredentialSecretsPresence}
 * so large ciphertext (e.g. `env_data`) never leaves the database for a list page.
 */
export const CREDENTIAL_LIST_SELECT = {
  id: true,
  projectId: true,
  productId: true,
  domainId: true,
  clientServiceRecordId: true,
  departmentId: true,
  ownerId: true,
  category: true,
  credentialType: true,
  criticality: true,
  providerId: true,
  provider: { select: { id: true, name: true } },
  name: true,
  url: true,
  login: true,
  phone: true,
  phones: true,
  appStorePlatform: true,
  accessLevel: true,
  allowedEmployees: true,
  publicNotes: true,
  lastRotatedAt: true,
  nextRotationAt: true,
  rotationOwnerId: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  project: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  owner: { select: { id: true, firstName: true, lastName: true } },
} as const;
