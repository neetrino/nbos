import axios from 'axios';
import { toApiError } from './api-errors';

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

let sessionSignOutInFlight: Promise<void> | null = null;

async function signOutOnUnauthorized(): Promise<void> {
  if (sessionSignOutInFlight) {
    await sessionSignOutInFlight;
    return;
  }

  sessionSignOutInFlight = (async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/sign-in' });
  })();

  try {
    await sessionSignOutInFlight;
  } finally {
    sessionSignOutInFlight = null;
  }
}

/**
 * Browser API client. Requests go to `/api/*`, rewritten to the BFF route which
 * injects the backend JWT from the httpOnly session cookie server-side.
 */
export const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

api.interceptors.response.use(
  (response) => {
    if (response.data && 'data' in response.data && 'timestamp' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        await signOutOnUnauthorized();
      }
    }

    if (axios.isAxiosError(error)) {
      return Promise.reject(toApiError(error.response?.data, error.message));
    }
    return Promise.reject(error);
  },
);
