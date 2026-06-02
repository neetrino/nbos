export type CredentialManualGrantLevel = 'VIEW' | 'EDIT';

export interface CredentialManualGrantInput {
  employeeId: string;
  level: CredentialManualGrantLevel;
}

export interface CredentialManualGrantRow {
  employeeId: string;
  level: CredentialManualGrantLevel;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  grantedAt: string;
  grantedBy: { id: string; firstName: string; lastName: string } | null;
}
