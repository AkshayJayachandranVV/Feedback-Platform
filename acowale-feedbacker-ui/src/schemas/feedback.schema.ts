import { z } from 'zod';

export const feedbackSchema = z.object({
  submitterName: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),

  submitterEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  categoryId: z
    .string()
    .min(1, 'Please select a category')
    .uuid('Please select a valid category'),

  rating: z
    .number({ message: 'Please select a rating' })
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),

  comment: z
    .string()
    .min(1, 'Comment is required')
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment must not exceed 1000 characters'),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;
