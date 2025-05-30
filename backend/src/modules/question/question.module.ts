/**
 * Question module for handling question-related functionality
 */

import { AiService } from '@modules/ai/ai.service';
import { ChunkService } from '@modules/chunks/chunk.service';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoModule } from '../video/video.module';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { Question, QuestionSchema } from './schemas/question.schema';
import { OpenAiProvider } from '@modules/ai/providers/openai.provider';
import { ClaudeProvider } from '@modules/ai/providers/claude.provider';
import { GeminiProvider } from '@modules/ai/providers/gemini.provider';
import { WhisperProvider } from '@modules/ai/providers/whisper.provider';
import { Chunk, ChunkSchema } from '@modules/chunks/schemas/chunk.schema';
import { InteractionService } from '@modules/interaction/interaction.service';
import { Interaction, InteractionSchema } from '@modules/interaction/schemas/interaction.schema';
import { AskController } from './ask.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Chunk.name, schema: ChunkSchema },
      { name: Interaction.name, schema: InteractionSchema },
    ]),
    forwardRef(() => VideoModule),
  ],
  controllers: [QuestionController, AskController],
  providers: [QuestionService, AiService, ChunkService, OpenAiProvider, ClaudeProvider, GeminiProvider, WhisperProvider,InteractionService ],
  exports: [QuestionService],
})
export class QuestionModule {}
