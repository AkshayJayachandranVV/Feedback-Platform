import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FilterFeedbackDto } from './dto/filter-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit feedback (public, rate-limited: 5/min per IP)' })
  async create(@Body() createFeedbackDto: CreateFeedbackDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.get('user-agent');
    const feedback = await this.feedbackService.create(createFeedbackDto, ipAddress, userAgent);
    return {
      success: true,
      message: 'Feedback submitted successfully! Thank you for your response.',
      data: feedback,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all feedback with filtering, search, and pagination (admin)' })
  async findAll(@Query() filterDto: FilterFeedbackDto) {
    const result = await this.feedbackService.findAll(filterDto);
    return {
      success: true,
      message: 'Feedback fetched successfully',
      ...result,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feedback by ID (admin)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const feedback = await this.feedbackService.findById(id);
    return {
      success: true,
      message: 'Feedback fetched successfully',
      data: feedback,
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update feedback status (admin)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateFeedbackStatusDto,
  ) {
    const feedback = await this.feedbackService.updateStatus(id, updateStatusDto);
    return {
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback,
    };
  }
}
