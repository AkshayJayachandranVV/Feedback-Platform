import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { Feedback } from '../feedback/schemas/feedback.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoryModel.findById(id).exec();
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = (dto.slug || dto.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await this.categoryModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    const category = new this.categoryModel({
      name: dto.name,
      slug,
      color: dto.color,
      icon: dto.icon,
    });
    return category.save();
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    let slug = category.slug;
    if (dto.slug || dto.name) {
      slug = (dto.slug || dto.name || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existing = await this.categoryModel.findOne({ slug, _id: { $ne: id } }).exec();
      if (existing) {
        throw new ConflictException(`Category with slug "${slug}" already exists`);
      }
    }

    if (dto.name) category.name = dto.name;
    category.slug = slug;
    if (dto.color) category.color = dto.color;
    if (dto.icon) category.icon = dto.icon;

    return category.save() as any;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.categoryModel.findOneAndDelete({
      _id: id,
      feedbackCount: 0,
    }).exec();

    if (!deleted) {
      const category = await this.categoryModel.findById(id).exec();
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      throw new BadRequestException('Cannot delete category: feedback exists under this category');
    }
  }

  async incrementFeedbackCount(id: string): Promise<Category | null> {
    return this.categoryModel.findOneAndUpdate(
      { _id: id },
      { $inc: { feedbackCount: 1 } },
      { new: true },
    ).exec();
  }

  async decrementFeedbackCount(id: string): Promise<void> {
    await this.categoryModel.updateOne(
      { _id: id },
      { $inc: { feedbackCount: -1 } },
    ).exec();
  }
}
