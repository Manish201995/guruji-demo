/**
 * Controller for handling user-interaction-related HTTP requests
 */

import {Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post} from '@nestjs/common';
import {InteractionService} from './interaction.service';
import {LogInteractionDto} from './dto/log-interaction.dto';
import {LogAnswerDto} from './dto/log-answer.dto';

@Controller('interactions')
export class InteractionController {
  private readonly logger = new Logger(InteractionController.name);

  constructor(private readonly interactionService: InteractionService) {}

  /**
   * Log a generic interaction
   * POST /api/interactions
   */
  @Post()
  async logInteraction(@Body() interactionDto: LogInteractionDto) {
    try {
      const { userId, videoId, questionId, type, data, videoTimestamp } = interactionDto;

      const interaction = await this.interactionService.logInteraction(
        userId,
        videoId,
        questionId,
        type,
        data,
        videoTimestamp,
      );

      return {
        success: true,
        interactionId: interaction._id,
      };
    } catch (error) {
      this.logger.error(`Error logging interaction: ${error.message}`, error.stack);
      throw new HttpException('Failed to log interaction', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Log an answer submission
   * POST /api/interactions/answers
   */
  @Post('answers')
  async logAnswer(@Body() answerDto: LogAnswerDto) {
    try {
      const { userId, videoId, questionId, answer, correct, videoTimestamp } = answerDto;

      const interaction = await this.interactionService.logAnswer(
        userId,
        videoId,
        questionId,
        answer,
        correct,
        videoTimestamp,
      );

      return {
        success: true,
        interactionId: interaction._id,
      };
    } catch (error) {
      this.logger.error(`Error logging answer: ${error.message}`, error.stack);
      throw new HttpException('Failed to log answer', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get analytics for a user on a video
   * GET /api/interactions/analytics/users/:userId/videos/:videoId
   */
  @Get('analytics/users/:userId/videos/:videoId')
  async getUserVideoAnalytics(
    @Param('userId') userId: string,
    @Param('videoId') videoId: string,
  ) {
    try {
      const analytics = await this.interactionService.getUserVideoAnalytics(userId, videoId);

      return {
        userId,
        videoId,
        ...analytics,
      };
    } catch (error) {
      this.logger.error(`Error getting user video analytics: ${error.message}`, error.stack);
      throw new HttpException('Failed to get analytics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all interactions for a user on a video
   * GET /api/interactions/users/:userId/videos/:videoId
   */
  @Get('users/:userId/videos/:videoId')
  async getUserVideoInteractions(
    @Param('userId') userId: string,
    @Param('videoId') videoId: string,
  ) {
    try {
      const interactions = await this.interactionService.getUserVideoInteractions(userId, videoId);

      return {
        userId,
        videoId,
        interactions,
      };
    } catch (error) {
      this.logger.error(`Error getting user video interactions: ${error.message}`, error.stack);
      throw new HttpException('Failed to get interactions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
