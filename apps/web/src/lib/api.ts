import axios from 'axios';
import { toApiError } from './api-errors';

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
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
  (error) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject(toApiError(error.response?.data, error.message));
    }
    return Promise.reject(error);
  },
);
