import { cache } from 'react';
import { auth } from '@/auth';

/** One Auth.js session read per request so layout and locale resolution share it. */
export const getCachedAuthSession = cache(async () => auth());
