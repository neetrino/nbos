export interface EmployeeOffboardingInventory {
  activeTaskCount: number;
  projectTeamCount: number;
  productTeamCount: number;
  resourceGrantCount: number;
  fileGrantCount: number;
  credentialGrantCount: number;
  projectIds: string[];
  productIds: string[];
  credentialIds: string[];
}

export interface EmployeeOffboardingRevokeSummary {
  resourceGrantsRevoked: number;
  fileGrantsRevoked: number;
  projectTeamRemovals: number;
  productTeamRemovals: number;
  credentialGrantsRevoked: number;
  credentialAllowedListEntriesCleared: number;
  credentialFavoritesRemoved: number;
  accessOverridesClosed: number;
}

export interface EmployeeOffboardingPreview {
  employeeId: string;
  employeeName: string;
  currentStatus: string;
  alreadyTerminated: boolean;
  inventory: EmployeeOffboardingInventory;
}

export interface EmployeeOffboardingResult {
  employeeId: string;
  status: string;
  fireDate: string;
  checklistInstanceId: string;
  inventory: EmployeeOffboardingInventory;
  revoked: EmployeeOffboardingRevokeSummary;
  financeNotificationsSent: number;
}
