import axios from 'axios';

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

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
      const message = error.response?.data?.message ?? error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);
