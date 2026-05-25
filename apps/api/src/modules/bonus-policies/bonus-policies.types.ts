export interface CreateBonusPolicyBody {
  name: string;
  templateCode: string;
  scope?: string;
  notes?: string;
}

export interface UpdateBonusPolicyBody {
  name?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  scope?: string | null;
  notes?: string | null;
}

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
