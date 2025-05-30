/**
 * DTO for logging a generic interaction
 */

import { IsString, IsEnum, IsOptional, IsNumber, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { InteractionType } from '../schemas/interaction.schema';

export class LogInteractionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsEnum(InteractionType)
  type: InteractionType;

  @IsNotEmpty()
  data: any;

  @IsNumber()
  @IsOptional()
  videoTimestamp?: number;
}