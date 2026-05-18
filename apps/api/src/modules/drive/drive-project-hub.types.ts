export type ProjectHubEntityRow = {
  id: string;
  label: string;
  fileCount: number;
};

export type ProjectDriveHubSummary = {
  projectId: string;
  projectCode: string;
  projectName: string;
  unsortedCount: number;
  allProjectLinkedCount: number;
  deals: ProjectHubEntityRow[];
  products: ProjectHubEntityRow[];
  tasks: ProjectHubEntityRow[];
  invoices: ProjectHubEntityRow[];
};
