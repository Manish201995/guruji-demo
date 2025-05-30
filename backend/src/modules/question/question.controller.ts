/**
 * Controller for handling question-related HTTP requests
 */

import { Controller, Get, Post, Body, Param, Logger, HttpStatus, HttpException, HttpCode } from "@nestjs/common";
import { QuestionService } from "./question.service";
import { AnswerSubmissionDto } from "./dto/answer-submission.dto";
import { ChunkService } from "@modules/chunks/chunk.service";
import { InteractionService } from "@modules/interaction/interaction.service";
import { VideoService } from "@modules/video/video.service";
import { AiService } from "@modules/ai/ai.service";
import { QuestionGenerationProvider } from "@modules/ai/providers/question-generation.provider";

@Controller("questions")
export class QuestionController {
  private readonly logger = new Logger(QuestionController.name);

  constructor(
    private readonly questionService: QuestionService,
    private readonly chunkService: ChunkService,
    private readonly interactionService: InteractionService,
    private readonly videoService: VideoService,
    private readonly ai: AiService,
    private readonly questionGen: QuestionGenerationProvider
  ) {}

  /**
   * Get questions for a specific video
   * GET /api/questions/videos/:videoId
   */
  @Get("videos/:videoId")
  async getQuestions(@Param("videoId") videoId: string) {
    try {
      const questions = await this.questionService.getQuestionsByVideoId(videoId);

      // Map to response format (exclude sensitive data)
      // const mappedQuestions = questions.map((q) => ({
      //   id: q._id,
      //   text: q.text,
      //   type: q.type,
      //   options: q.options,
      //   timestamp: q.timestamp,
      //   hint: q.hint,
      // }));

      return {
        videoId,
        questions,
      };
    } catch (error) {
      this.logger.error(`Error getting questions: ${error.message}`, error.stack);
      throw new HttpException("Failed to get questions", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post("answers")
  async submitAnswer(@Body() dto: AnswerSubmissionDto) {
    const { userId, questionId, videoId, answer } = dto;
    const result = await this.questionService.validateAnswer(questionId, answer);

    // log interaction
    await this.interactionService.logAnswer(userId, videoId, questionId, answer, result.correct);

    // check last 3 answers accuracy
    const stats = await this.interactionService.calcRecentAccuracy(userId, videoId, questionId, 3);
    const revise = stats.trials === 3 && stats.accuracy < 0.6 ? { seekSec: stats.chunkStartSec - 30 } : undefined;

    return { questionId, ...result, revise };
  }

  /**
   * Get a specific question by ID
   * GET /api/questions/:questionId
   */
  @Get(":questionId")
  async getQuestion(@Param("questionId") questionId: string) {
    try {
      const question = await this.questionService.getQuestionById(questionId);

      // Map to response format (exclude sensitive data)
      return {
        id: question._id,
        videoId: question.videoId,
        text: question.text,
        type: question.type,
        options: question.options,
        timestamp: question.timestamp,
        hint: question.hint,
      };
    } catch (error) {
      this.logger.error(`Error getting question: ${error.message}`, error.stack);
      throw new HttpException("Failed to get question", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // PATCH src/modules/question/question.controller.ts
  @Get("videos/:videoId/time/:sec")
  async getChunkQuestions(@Param("videoId") videoId: string, @Param("sec") sec: number) {
    const chunk = await this.chunkService.findChunkByTime(videoId, +sec);
    if (!chunk) return { videoId, questions: [] };

    const q = await this.questionService.getQuestionsByChunk(videoId, chunk.idx);
    return { videoId, chunkIdx: chunk.idx, questions: q };
  }

  /** POST /api/questions/videos/:videoId/regenerate */
  @Post("videos/:videoId/regenerate")
  async regenerate(@Param("videoId") vid: string) {
    const video = await this.videoService.findByVideoId(vid);
    if (!video.transcript) throw new HttpException("Transcript missing", 400);

    // 1) split transcript -> chunks (simple splitter as placeholder)
    await this.chunkService.deleteChunksByVideoId(vid);
    const sentences = video.transcript.split(". ");
    for (let i = 0; i < sentences.length; i++) {
      await this.chunkService["chunkModel"].create({
        videoId: vid,
        idx: i,
        startSec: i * 60,
        endSec: i * 60 + 59,
        text: sentences[i],
        vector: await this.ai.embed(sentences[i]),
      });
    }

    // 2) ask LLM to make questions
    await this.questionService.deleteQuestionsByVideoId(vid);
    const qs = await this.questionGen.generateQuestions(vid, video.transcript);
    await this.questionService.createQuestions(qs);

    return { ok: true, generated: qs.length };
  }

  @Post("videos/:videoId/generate-from-chunks")
  @HttpCode(HttpStatus.ACCEPTED)
  async kickGeneration(@Param("videoId") videoId: string) {
    this.questionService
      .generateQuestionsFromChunks(videoId)
      .then((res) => this.logger.log(`✅ generated ${res.length} questions for ${videoId}`))
      .catch((err) => this.logger.error(`❌ generation failed: ${err.message}`));

    return {
      status: "running",
      videoId,
      note: "Questions are being generated in the background; check /questions/videos/:videoId later.",
    };
  }

  @Post("videos/:videoId/auto")
  @HttpCode(HttpStatus.ACCEPTED)
  async autoGen(@Param("videoId") videoId: string) {
    this.questionService
      // .generateQuestionsByTopics(videoId)
      .generateQuestionsAuto(videoId)
      .then((qs) => this.logger.log(`✅ auto-generated ${qs.length} timed Qs for ${videoId}`))
      .catch((err) => this.logger.error(`❌ auto-generation failed: ${err.message}`));

    return {
      status: "running",
      videoId,
      note: "Timed questions are being generated; poll GET /api/questions/videos/:videoId",
    };
  }
}
