/**
 * Service for handling video-related operations
 */

import { QuestionGenerationProvider } from "@modules/ai/providers/question-generation.provider";
import { TranscriptProvider } from "@modules/ai/providers/transcript.provider";
import { forwardRef, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { QuestionService } from "../question/question.service";
import { Video, VideoDocument } from "./schemas/video.schema";
import { ChunkService } from "@modules/chunks/chunk.service";

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    private transcriptService: TranscriptProvider,
    private questionGenerationProvider: QuestionGenerationProvider,
    private chunkService: ChunkService,
    @Inject(forwardRef(() => QuestionService)) private questionService: QuestionService
  ) {}

  /**
   * Find a video by its YouTube ID
   */
  async findByVideoId(videoId: string): Promise<Video> {
    const video = await this.videoModel.findOne({ _id: videoId }).exec();
    if (!video) {
      throw new NotFoundException(`Video with ID ${videoId} not found`);
    }
    return video;
  }

  /**
   * Check if a video exists and has been processed
   */
  async checkVideoStatus(videoId: string): Promise<{ exists: boolean; processed: boolean }> {
    try {
      const video = await this.videoModel.findOne({ _id: videoId }).exec();
      if (!video) {
        return { exists: false, processed: false };
      }
      return { exists: true, processed: video.processed };
    } catch (error) {
      this.logger.error(`Error checking video status: ${error.message}`, error.stack);
      return { exists: false, processed: false };
    }
  }

  /**
   * Create a new video entry or update an existing one
   */
async createOrUpdateVideo(videoId: string, data: Partial<Video>): Promise<VideoDocument> {
  return this.videoModel.findOneAndUpdate(
    { videoId },
    { $set: { ...data, videoId } },
    { new: true, upsert: true },
  ).exec();
}

  /**
   * Process a video to extract transcript and generate questions
   */
  async processVideo(videoId: string): Promise<void> {
    try {
      // Check if video exists
      let video = await this.videoModel.findOne({ videoId }).exec();

      // If not, create a new entry
      if (!video) {
        // Create a new video entry and then fetch it to ensure type compatibility
        await this.createOrUpdateVideo(videoId, {
          processingStatus: "processing",
        });
        video = await this.videoModel.findOne({ videoId }).exec();
      } else if (video.processingStatus === "processing") {
        // Already processing, do nothing
        return;
      } else {
        // Update status to processing
        video = await this.videoModel
          .findOneAndUpdate(
            { videoId },
            {
              $set: {
                processingStatus: "processing",
                lastProcessed: new Date(),
              },
            },
            { new: true }
          )
          .exec();
      }

      // Start processing in the background
      await this.processVideoInBackground(videoId);
    } catch (error) {
      this.logger.error(`Error initiating video processing: ${error.message}`, error.stack);
      await this.videoModel
        .findOneAndUpdate(
          { videoId },
          {
            $set: {
              processingStatus: "failed",
              processingError: error.message,
            },
          }
        )
        .exec();
      throw error;
    }
  }

  /**
   * Process video in the background (non-blocking)
   */
  private async processVideoInBackground(videoId: string): Promise<void> {
    try {
      // Extract transcript using AI service
      const transcript = await this.transcriptService.extractTranscript(videoId);

      // Update video with transcript
      await this.videoModel
        .findOneAndUpdate(
          { videoId },
          {
            $set: {
              transcript,
            },
          },
          { new: true }
        )
        .exec();

      // Generate questions using AI service
      const questions = await this.questionGenerationProvider.generateQuestions(videoId, transcript);

      // Delete any existing questions for this video
      await this.questionService.deleteQuestionsByVideoId(videoId);

      // Save questions to the question collection
      await this.questionService.createQuestions(questions);

      // Mark video as processed
      await this.videoModel
        .findOneAndUpdate(
          { videoId },
          {
            $set: {
              processed: true,
              processingStatus: "completed",
            },
          },
          { new: true }
        )
        .exec();

      this.logger.log(`Successfully processed video ${videoId}`);
    } catch (error) {
      this.logger.error(`Error processing video in background: ${error.message}`, error.stack);
      await this.videoModel
        .findOneAndUpdate(
          { videoId },
          {
            $set: {
              processingStatus: "failed",
              processingError: error.message,
            },
          }
        )
        .exec();
    }
  }

  // bottom of class
  listVideos() {
    return this.videoModel.find().lean();
  }

  async removeVideo(videoId: string) {
    await this.videoModel.deleteOne({ videoId });
    await this.questionService.deleteQuestionsByVideoId(videoId);
    await this.chunkService?.deleteChunksByVideoId?.(videoId); // see 2-b
  }
}
