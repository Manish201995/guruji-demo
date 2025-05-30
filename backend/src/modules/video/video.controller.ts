/**
 * Controller for handling video-related HTTP requests
 */

import { Controller, Get, Post, Param, Body, Logger, HttpStatus, HttpException, Put, Delete } from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoDto, UpdateVideoDto } from './dto/video.dto';

@Controller('videos')
export class VideoController {
  private readonly logger = new Logger(VideoController.name);

  constructor(private readonly videoService: VideoService) {}

  /**
   * Check if a video has been processed
   * GET /api/videos/:videoId/status
   */
  @Get(':videoId/status')
  async getVideoStatus(@Param('videoId') videoId: string) {
    try {
      const status = await this.videoService.checkVideoStatus(videoId);
      return {
        videoId,
        ...status,
      };
    } catch (error) {
      this.logger.error(`Error getting video status: ${error.message}`, error.stack);
      throw new HttpException('Failed to get video status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Request processing for a video
   * POST /api/videos/:videoId/process
   */
  @Post(':videoId/process')
  async processVideo(@Param('videoId') videoId: string) {
    try {
      // Check if video is already processed
      const status = await this.videoService.checkVideoStatus(videoId);
      
      if (status.exists && status.processed) {
        return {
          videoId,
          status: 'already_processed',
          message: 'Video has already been processed',
        };
      }
      
      // Start processing
      await this.videoService.processVideo(videoId);
      
      return {
        videoId,
        status: 'processing',
        message: 'Video processing has been initiated',
      };
    } catch (error) {
      this.logger.error(`Error processing video: ${error.message}`, error.stack);
      throw new HttpException('Failed to process video', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get video details
   * GET /api/videos/:videoId
   */
  @Get(':videoId')
  async getVideo(@Param('videoId') videoId: string) {
    try {
      const video = await this.videoService.findByVideoId(videoId);
      return {
        videoId: video.videoId,
        title: video.title,
        channelTitle: video.channelTitle,
        processed: video.processed,
        processingStatus: video.processingStatus,
        duration: video.duration,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error getting video: ${error.message}`, error.stack);
      throw new HttpException('Failed to get video', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  /** POST /api/videos  – add a record before processing */
  @Post()
  async createVideo(@Body() dto: CreateVideoDto) {
    const doc = await this.videoService.createOrUpdateVideo(dto.videoId, dto);
    return { id: doc._id, videoId: doc.videoId };
  }

  /** GET /api/videos  – list */
  @Get()
  list() { return this.videoService.listVideos(); }

  /** PUT /api/videos/:videoId  – update metadata */
  @Put(':videoId')
  async update(@Param('videoId') id: string, @Body() dto: UpdateVideoDto) {
    return this.videoService.createOrUpdateVideo(id, dto);
  }

  /** DELETE /api/videos/:videoId */
  @Delete(':videoId')
  async remove(@Param('videoId') id: string) {
    await this.videoService.removeVideo(id);
    return { ok: true };
  }
  
  
}