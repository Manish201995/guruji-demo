// src/modules/video/dto/video.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateVideoDto {
  @IsString()              videoId: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() url?: string;
}

export class UpdateVideoDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() transcript?: string;
  @IsOptional() @IsString() transcriptWithTimestamps?: string;
}
