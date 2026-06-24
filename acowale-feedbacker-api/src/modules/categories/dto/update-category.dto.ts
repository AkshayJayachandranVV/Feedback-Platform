import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiProperty({ description: 'Category Name', example: 'Billing & Payments', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Unique category slug', example: 'billing-payments', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Color representation (Hex/Tailwind class)', example: '#3b82f6', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Icon symbol or Emoji', example: '💳', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  icon?: string;
}
