import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackStatus } from '../schemas/feedback.schema';

export class UpdateFeedbackStatusDto {
  @ApiPropertyOptional({ enum: FeedbackStatus })
  @IsEnum(FeedbackStatus, { message: 'Invalid status. Must be pending, reviewed, or archived' })
  status: FeedbackStatus;
}
