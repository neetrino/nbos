import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: string;
  roleLevel: number;
  departmentIds: string[];
  firstName: string;
  lastName: string;
  permissions: Record<string, string>;
  meProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    telegram: string | null;
    avatar: string | null;
    position: string | null;
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
  };
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: CurrentUserPayload }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
