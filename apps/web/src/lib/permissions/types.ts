export type PermissionScope = 'OWN' | 'DEPARTMENT' | 'ALL';

export interface PermissionMap {
  [moduleAction: string]: PermissionScope;
}

export interface MeResponse {
  id: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  telegram?: string;
  avatar?: string;
  position?: string;
  role: {
    id: string;
    name: string;
    slug: string;
    level: number;
  };
  departments: Array<{
    id: string;
    departmentId: string;
    deptRole: string;
    isPrimary: boolean;
    department: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  permissions: PermissionMap;
}
