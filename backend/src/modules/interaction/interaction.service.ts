/**
 * Service for handling user interaction-related operations
 */

import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Interaction, InteractionDocument, InteractionType } from "./schemas/interaction.schema";
import { QuestionService } from "../question/question.service";

@Injectable()
export class InteractionService {
  private readonly logger = new Logger(InteractionService.name);

  constructor(
    @InjectModel(Interaction.name) private interactionModel: Model<InteractionDocument>,
    private questionService: QuestionService
  ) {}

  /**
   * Log a user interaction with a question
   */
  async logInteraction(
    userId: string,
    videoId: string,
    questionId: string,
    type: InteractionType,
    data: any,
    videoTimestamp?: number
  ): Promise<Interaction> {
    try {
      const interaction = new this.interactionModel({
        userId,
        videoId,
        questionId,
        type,
        data,
        videoTimestamp,
        interactionTime: new Date(),
      });

      return await interaction.save();
    } catch (error) {
      this.logger.error(`Error logging interaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Log an answer submission
   */
  async logAnswer(
    userId: string,
    videoId: string,
    questionId: string,
    answer: string | number,
    correct: boolean,
    videoTimestamp?: number
  ): Promise<Interaction> {
    return this.logInteraction(
      userId,
      videoId,
      questionId,
      InteractionType.ANSWER,
      { answer, correct },
      videoTimestamp
    );
  }

  /**
   * Log a hint request
   */
  async logHintRequest(
    userId: string,
    videoId: string,
    questionId: string,
    videoTimestamp?: number
  ): Promise<Interaction> {
    return this.logInteraction(userId, videoId, questionId, InteractionType.HINT_REQUEST, {}, videoTimestamp);
  }

  /**
   * Log a rewatch action
   */
  async logRewatch(
    userId: string,
    videoId: string,
    questionId: string,
    rewatchTimestamp: number,
    videoTimestamp?: number
  ): Promise<Interaction> {
    return this.logInteraction(
      userId,
      videoId,
      questionId,
      InteractionType.REWATCH,
      { rewatchTimestamp },
      videoTimestamp
    );
  }

  /**
   * Log a question skip
   */
  async logSkip(userId: string, videoId: string, questionId: string, videoTimestamp?: number): Promise<Interaction> {
    return this.logInteraction(userId, videoId, questionId, InteractionType.SKIP, {}, videoTimestamp);
  }

  /**
   * Get all interactions for a user on a specific video
   */
  async getUserVideoInteractions(userId: string, videoId: string): Promise<Interaction[]> {
    try {
      return this.interactionModel.find({ userId, videoId }).sort({ interactionTime: 1 }).exec();
    } catch (error) {
      this.logger.error(`Error getting user video interactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all interactions for a specific question
   */
  async getQuestionInteractions(questionId: string): Promise<Interaction[]> {
    try {
      return this.interactionModel.find({ questionId }).sort({ interactionTime: 1 }).exec();
    } catch (error) {
      this.logger.error(`Error getting question interactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get basic analytics for a user on a video
   */
  async getUserVideoAnalytics(
    userId: string,
    videoId: string
  ): Promise<{
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    hintRequests: number;
    rewatches: number;
    skips: number;
  }> {
    try {
      const interactions = await this.getUserVideoInteractions(userId, videoId);

      // Initialize counters
      const result = {
        totalQuestions: 0, // Will be set later
        answeredQuestions: 0,
        correctAnswers: 0,
        hintRequests: 0,
        rewatches: 0,
        skips: 0,
      };

      // Count different interaction types
      const questionIds = new Set<string>();

      interactions.forEach((interaction) => {
        questionIds.add(interaction.questionId);

        switch (interaction.type) {
          case InteractionType.ANSWER:
            result.answeredQuestions++;
            if (interaction.data?.correct) {
              result.correctAnswers++;
            }
            break;
          case InteractionType.HINT_REQUEST:
            result.hintRequests++;
            break;
          case InteractionType.REWATCH:
            result.rewatches++;
            break;
          case InteractionType.SKIP:
            result.skips++;
            break;
        }
      });

      // Get total questions for the video
      const questions = await this.questionService.getQuestionsByVideoId(videoId);
      result.totalQuestions = questions.length;

      return result;
    } catch (error) {
      this.logger.error(`Error getting user video analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  async calcRecentAccuracy(userId: string, videoId: string, qId: string, n: number) {
    const q = await this.questionService.getQuestionById(qId);
    const recent = await this.interactionModel
      .find({ userId, videoId, "data.answer": { $exists: true }, questionId: qId })
      .sort({ interactionTime: -1 })
      .limit(n)
      .lean();

    const correct = recent.filter((r) => r.data.correct).length;
    return {
      trials: recent.length,
      accuracy: recent.length ? correct / recent.length : 1,
      chunkStartSec: q.timestamp,
    };
  }
}
