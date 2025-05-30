/**
 * DTO for logging an answer submission
 */

import { IsString, IsBoolean, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class LogAnswerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsNotEmpty()
  answer: string | number;

  @IsBoolean()
  correct: boolean;

  @IsNumber()
  @IsOptional()
  videoTimestamp?: number;
}