import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Feedback, FeedbackDocument, FeedbackStatus } from './schemas/feedback.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FilterFeedbackDto } from './dto/filter-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,
    private readonly categoriesService: CategoriesService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(
    createFeedbackDto: CreateFeedbackDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<FeedbackDocument> {
    // Atomically increment the category's feedback count
    const category = await this.categoriesService.incrementFeedbackCount(createFeedbackDto.categoryId);
    if (!category) {
      throw new BadRequestException('Invalid category selected');
    }

    try {
      const feedback = new this.feedbackModel({
        ...createFeedbackDto,
        ipAddress,
        userAgent,
      });

      const saved = await feedback.save();
      
      this.logger.info('Feedback submitted', {
        feedbackId: saved.id,
        categoryId: saved.categoryId,
        rating: saved.rating,
      });

      // Populate category virtual before returning
      await saved.populate('category');

      return saved;
    } catch (err) {
      // Rollback the increment atomic counter if database save fails
      await this.categoriesService.decrementFeedbackCount(createFeedbackDto.categoryId);
      throw err;
    }
  }

  async findAll(filterDto: FilterFeedbackDto) {
    const {
      search,
      categoryId,
      status,
      rating,
      startDate,
      endDate,
      cursor,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const allowedSortFields = ['createdAt', 'rating', 'submitterName'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'ASC' ? 1 : -1;

    const filter: any = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { submitterName: searchRegex },
        { submitterEmail: searchRegex },
        { comment: searchRegex },
      ];
    }

    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;
    if (rating) filter.rating = rating;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // ── Cursor-based seek ──────────────────────────────────────────────────
    // Instead of skip(), we find the cursor document and use its sort-field
    // value as a boundary, seeking the index directly. O(log n) always.
    if (cursor) {
      const cursorDoc = await this.feedbackModel.findById(cursor).exec();
      if (cursorDoc) {
        const cursorValue = (cursorDoc as any)[safeSortBy];
        const seekOp = sortDir === -1 ? '$lt' : '$gt';

        // Use compound condition: (sortField < cursorValue) OR
        // (sortField == cursorValue AND _id < cursorId) for stable tiebreak
        const seekCondition = {
          $or: [
            { [safeSortBy]: { [seekOp]: cursorValue } },
            { [safeSortBy]: cursorValue, _id: { [seekOp]: cursor } },
          ],
        };

        // Merge with existing filters using $and
        filter.$and = filter.$and
          ? [...filter.$and, seekCondition]
          : [seekCondition];
      }
    }

    const sortObj: any = { [safeSortBy]: sortDir, _id: sortDir };

    // Fetch one extra document to determine if a next page exists
    const docs = await this.feedbackModel
      .find(filter)
      .populate('category')
      .sort(sortObj)
      .limit(limit + 1)
      .exec();

    const hasNextPage = docs.length > limit;
    const data = hasNextPage ? docs.slice(0, limit) : docs;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    return {
      data,
      meta: {
        limit,
        hasNextPage,
        nextCursor,
        // total count only on first page (no cursor) to avoid expensive count on every page
        total: cursor ? undefined : await this.feedbackModel.countDocuments(
          // count without cursor filter
          Object.fromEntries(
            Object.entries(filter).filter(([k]) => k !== '$and')
          )
        ).exec(),
      },
    };
  }

  async findById(id: string): Promise<FeedbackDocument> {
    const feedback = await this.feedbackModel.findById(id).populate('category').exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with id ${id} not found`);
    }
    return feedback;
  }

  async updateStatus(id: string, dto: UpdateFeedbackStatusDto): Promise<FeedbackDocument> {
    const feedback = await this.findById(id);
    feedback.status = dto.status;
    const updated = await feedback.save();
    this.logger.info('Feedback status updated', { feedbackId: id, status: dto.status });
    return updated;
  }
}
