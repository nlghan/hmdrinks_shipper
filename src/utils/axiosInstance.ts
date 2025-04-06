import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';

const BASE_URL = 'http://192.168.9.195:1010/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null; // Kiểm tra môi trường để tránh lỗi
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

const publicAPIs: string[] = [
  '/v1/auth/login',
  '/v1/auth/register',
  '/cate/list-category/',
];

// Biến theo dõi refresh token
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshToken = async (): Promise<string> => {
  try {
    const refreshToken = getCookie('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const tokenParts = refreshToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Refresh token expired');
      }
    }

    const response: AxiosResponse<{ access_token: string; refresh_token?: string }> =
      await axios.post(`${BASE_URL}/v1/auth/refresh-token`, null, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

    if (typeof document !== 'undefined') {
      document.cookie = `access_token=${response.data.access_token}; path=/`;
      if (response.data.refresh_token) {
        document.cookie = `refresh_token=${response.data.refresh_token}; path=/`;
      }
    }

    return response.data.access_token;
  } catch (error) {
    if (typeof document !== 'undefined') {
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
    throw error;
  }
};

axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig<any>) => {
      const token = getCookie('access_token');
  
      if (token && !publicAPIs.some(api => config.url?.includes(api))) {
        config.headers = config.headers || new AxiosHeaders();
        config.headers.set('Authorization', `Bearer ${token}`);
      }
  
      return config;
    },
    (error) => Promise.reject(error)
  );
  

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig<any> & { _retry?: boolean };
  
      if (error.code === 'ERR_NETWORK') {
        return Promise.reject(error);
      }
  
      if (error.response?.status === 410 && !originalRequest._retry) {
        if (isRefreshing) {
          try {
            const token = await new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          } catch (err) {
            return Promise.reject(err);
          }
        }
  
        isRefreshing = true;
        originalRequest._retry = true;
  
        try {
          const newToken = await refreshToken();
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
  
      return Promise.reject(error);
    }
  );  

export default axiosInstance;
