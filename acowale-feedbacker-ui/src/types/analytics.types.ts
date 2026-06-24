export interface CategoryStat {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  count: number;
}

export interface RatingStat {
  rating: number;
  count: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  totalFeedback: number;
  avgRating: number;
  categoryDistribution: CategoryStat[];
  ratingDistribution: RatingStat[];
  statusDistribution: StatusStat[];
  recentFeedback: import('./feedback.types').Feedback[];
  trendData: TrendPoint[];
}
