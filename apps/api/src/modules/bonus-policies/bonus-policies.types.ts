export interface BonusPolicyDto {
  id: string;
  name: string;
  templateCode: string;
  status: string;
  scope: string | null;
  notes: string | null;
  linkedProfileCount: number;
  createdAt: string;
  updatedAt: string;
}
