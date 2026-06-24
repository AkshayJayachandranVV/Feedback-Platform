import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { getModelToken } from '@nestjs/mongoose';
import { Feedback, FeedbackStatus } from './schemas/feedback.schema';
import { CategoriesService } from '../categories/categories.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FeedbackService', () => {
  let service: FeedbackService;

  const mockCategory = { id: 'cat-uuid', name: 'Bug Report', slug: 'bug-report', color: '#ef4444', icon: '🐛' };
  const mockFeedback = {
    id: 'fb-uuid',
    submitterName: 'Alice',
    submitterEmail: 'alice@example.com',
    categoryId: 'cat-uuid',
    rating: 4,
    comment: 'Great product overall',
    status: FeedbackStatus.PENDING,
    populate: jest.fn().mockResolvedValue(undefined),
    save: jest.fn(),
  };

  // Mock Mongoose Model constructor and query methods
  const mockFeedbackModel: any = jest.fn().mockImplementation(() => ({
    ...mockFeedback,
    save: jest.fn().mockResolvedValue({
      ...mockFeedback,
      populate: jest.fn().mockResolvedValue(mockFeedback),
    }),
  }));

  mockFeedbackModel.find = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([mockFeedback]),
  });

  mockFeedbackModel.countDocuments = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(1),
  });

  // findById used both for cursor lookup and record lookup
  mockFeedbackModel.findById = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null), // default: cursor lookup returns null (no seek)
    populate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockFeedback),
    }),
  });

  const mockCategoriesService = {
    findById: jest.fn(),
    incrementFeedbackCount: jest.fn(),
    decrementFeedbackCount: jest.fn(),
  };

  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getModelToken(Feedback.name), useValue: mockFeedbackModel },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException for invalid category', async () => {
      mockCategoriesService.incrementFeedbackCount.mockResolvedValue(null);
      await expect(
        service.create({ submitterName: 'Alice', submitterEmail: 'a@a.com', categoryId: 'invalid', rating: 5, comment: 'Great product' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and return feedback for valid input', async () => {
      mockCategoriesService.incrementFeedbackCount.mockResolvedValue(mockCategory);

      const result = await service.create({
        submitterName: 'Alice',
        submitterEmail: 'alice@example.com',
        categoryId: 'cat-uuid',
        rating: 4,
        comment: 'Great product overall',
      });

      expect(result.submitterName).toEqual(mockFeedback.submitterName);
      expect(result.submitterEmail).toEqual(mockFeedback.submitterEmail);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException when feedback not found', async () => {
      mockFeedbackModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return feedback when found', async () => {
      mockFeedbackModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockFeedback),
        }),
      });
      const result = await service.findById('fb-uuid');
      expect(result).toEqual(mockFeedback);
    });
  });

  describe('updateStatus', () => {
    it('should update and return feedback with new status', async () => {
      const updatedFeedback = { ...mockFeedback, status: FeedbackStatus.REVIEWED };
      
      mockFeedbackModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            ...mockFeedback,
            save: jest.fn().mockResolvedValue(updatedFeedback),
          }),
        }),
      });

      const result = await service.updateStatus('fb-uuid', { status: FeedbackStatus.REVIEWED });
      expect(result.status).toBe(FeedbackStatus.REVIEWED);
    });
  });
});
