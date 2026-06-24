import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  submitterName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  submitterEmail: string;

  @ApiProperty({ description: 'Category UUID' })
  @IsUUID('4', { message: 'Please select a valid category' })
  @IsNotEmpty({ message: 'Category is required' })
  categoryId: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt({ message: 'Rating must be a whole number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating: number;

  @ApiProperty({ example: 'The service was excellent!' })
  @IsString()
  @IsNotEmpty({ message: 'Comment is required' })
  @MinLength(10, { message: 'Comment must be at least 10 characters' })
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  comment: string;
}
