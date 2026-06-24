export type FeedbackStatus = 'pending' | 'reviewed' | 'archived';

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

export interface Feedback {
  id: string;
  submitterName: string;
  submitterEmail: string;
  category: Category;
  categoryId: string;
  rating: number;
  comment: string;
  status: FeedbackStatus;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackPayload {
  submitterName: string;
  submitterEmail: string;
  categoryId: string;
  rating: number;
  comment: string;
}

export interface FeedbackFilters {
  search?: string;
  categoryId?: string;
  status?: FeedbackStatus;
  rating?: number;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedFeedback {
  data: Feedback[];
  meta: {
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
    total?: number; // only present on first page (no cursor)
  };
}

