import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category Name', example: 'Billing & Payments' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique category slug', example: 'billing-payments', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Color representation (Hex/Tailwind class)', example: '#3b82f6' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ description: 'Icon symbol or Emoji', example: '💳' })
  @IsString()
  @IsNotEmpty()
  icon: string;
}
