/**
 * DTO for submitting an answer to a question
 */

import {IsNotEmpty, IsString} from 'class-validator';

export class AnswerSubmissionDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsNotEmpty()
  answer: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}