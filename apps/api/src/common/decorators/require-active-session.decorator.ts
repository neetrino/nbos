import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ACTIVE_SESSION_KEY = 'requireActiveSession';

/** High-risk routes: V2 must have an ACTIVE AuthSession. Legacy v1 is allowed during dual-run. */
export const RequireActiveSession = () => SetMetadata(REQUIRE_ACTIVE_SESSION_KEY, true);
