import axiosInstance from './axios.instance';
import type { AnalyticsSummary } from '../types/analytics.types';

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const res = await axiosInstance.get('/analytics/summary');
    return res.data.data;
  },
};
