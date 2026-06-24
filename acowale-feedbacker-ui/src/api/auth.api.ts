import axiosInstance from './axios.instance';
import type { AuthUser, LoginCredentials } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: AuthUser }> => {
    const res = await axiosInstance.post('/auth/login', credentials);
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  refreshToken: async (): Promise<void> => {
    await axiosInstance.post('/auth/refresh');
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await axiosInstance.get('/auth/me');
    return res.data.data.user;
  },
};
