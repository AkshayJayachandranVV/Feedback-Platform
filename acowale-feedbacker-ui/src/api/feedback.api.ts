import axiosInstance from './axios.instance';
import type {
  CreateFeedbackPayload,
  Feedback,
  FeedbackFilters,
  PaginatedFeedback,
  FeedbackStatus,
} from '../types/feedback.types';

export const feedbackApi = {
  submit: async (payload: CreateFeedbackPayload): Promise<Feedback> => {
    const res = await axiosInstance.post('/feedback', payload);
    return res.data.data;
  },

  getAll: async (filters?: FeedbackFilters): Promise<PaginatedFeedback> => {
    const res = await axiosInstance.get('/feedback', { params: filters });
    return { data: res.data.data, meta: res.data.meta };
  },

  getById: async (id: string): Promise<Feedback> => {
    const res = await axiosInstance.get(`/feedback/${id}`);
    return res.data.data;
  },

  updateStatus: async (id: string, status: FeedbackStatus): Promise<Feedback> => {
    const res = await axiosInstance.patch(`/feedback/${id}/status`, { status });
    return res.data.data;
  },
};
