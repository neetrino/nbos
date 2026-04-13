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
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: CurrentUserPayload }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
