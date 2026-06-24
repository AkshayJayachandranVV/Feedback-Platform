import axiosInstance from './axios.instance';
import type { Category } from '../types/feedback.types';

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await axiosInstance.get('/categories');
    return res.data.data;
  },
  create: async (data: Partial<Category>): Promise<Category> => {
    const res = await axiosInstance.post('/categories', data);
    return res.data.data;
  },
  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    const res = await axiosInstance.patch(`/categories/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
  },
};
