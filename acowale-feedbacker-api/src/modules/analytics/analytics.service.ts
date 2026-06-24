import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback } from '../feedback/schemas/feedback.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,
  ) {}

  async getSummary() {
    const [
      totalFeedback,
      categoryDistribution,
      ratingDistribution,
      statusDistribution,
      recentFeedback,
      trendData,
    ] = await Promise.all([
      this.getTotalCount(),
      this.getCategoryDistribution(),
      this.getRatingDistribution(),
      this.getStatusDistribution(),
      this.getRecentFeedback(),
      this.getTrendData(),
    ]);

    const avgRating = await this.getAverageRating();

    return {
      totalFeedback,
      avgRating,
      categoryDistribution,
      ratingDistribution,
      statusDistribution,
      recentFeedback,
      trendData,
    };
  }

  private async getTotalCount(): Promise<number> {
    return this.feedbackModel.countDocuments().exec();
  }

  private async getAverageRating(): Promise<number> {
    const result = await this.feedbackModel.aggregate([
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
        },
      },
    ]).exec();
    return result[0] ? parseFloat(result[0].avg.toFixed(2)) : 0;
  }

  private async getCategoryDistribution() {
    return this.feedbackModel.aggregate([
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: '$category.name',
          color: '$category.color',
          icon: '$category.icon',
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]).exec();
  }

  private async getRatingDistribution() {
    return this.feedbackModel.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          rating: '$_id',
          count: 1,
        },
      },
      {
        $sort: { rating: 1 },
      },
    ]).exec();
  }

  private async getStatusDistribution() {
    return this.feedbackModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
    ]).exec();
  }

  private async getRecentFeedback() {
    return this.feedbackModel.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('category')
      .exec();
  }

  private async getTrendData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.feedbackModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]).exec();
  }
}
