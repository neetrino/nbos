export type ProjectHubEntityRow = {
  id: string;
  label: string;
  fileCount: number;
};

export type ProjectHubClientRow = ProjectHubEntityRow & {
  entityType: 'COMPANY' | 'CONTACT';
};

export type ProjectHubProductRow = ProjectHubEntityRow & {
  extensions: ProjectHubEntityRow[];
};

export type ProjectDriveHubSummary = {
  projectId: string;
  projectCode: string;
  projectName: string;
  deals: ProjectHubEntityRow[];
  products: ProjectHubProductRow[];
  client: ProjectHubClientRow[];
  tasks: ProjectHubEntityRow[];
  invoices: ProjectHubEntityRow[];
};
