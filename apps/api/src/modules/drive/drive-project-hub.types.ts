export type ProjectHubEntityRow = {
  id: string;
  label: string;
  fileCount: number;
};

export type ProjectDriveHubSummary = {
  projectId: string;
  projectCode: string;
  projectName: string;
  deals: ProjectHubEntityRow[];
  products: ProjectHubEntityRow[];
  tasks: ProjectHubEntityRow[];
  invoices: ProjectHubEntityRow[];
};
