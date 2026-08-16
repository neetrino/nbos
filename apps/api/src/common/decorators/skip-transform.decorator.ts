import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/** Skip the global `{ data, timestamp }` wrapper (required for SSE streams). */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
