import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

export interface RequiredPermission {
  module: string;
  action: string;
}

export const RequirePermission = (module: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { module, action } satisfies RequiredPermission);

/**
 * Grants access when the caller holds at least one of the listed permissions. Use it for shared
 * reads that several modules depend on (for example CRM dictionaries owned by Marketing), not to
 * widen a module's own surface. The request scope comes from the first permission that matches, so
 * list the narrowest owner first.
 */
export const RequireAnyPermission = (...permissions: readonly RequiredPermission[]) =>
  SetMetadata(PERMISSION_KEY, [...permissions] satisfies RequiredPermission[]);
