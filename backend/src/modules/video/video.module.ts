/**
 * Video module for handling video-related functionality
 */

import {Module, forwardRef} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {VideoController} from './video.controller';
import {VideoService} from './video.service';
import {Video, VideoSchema} from './schemas/video.schema';
import {AiModule} from '../ai/ai.module';
import {QuestionModule} from '../question/question.module';
import { TranscriptProvider } from '@modules/ai/providers/transcript.provider';
import { QuestionGenerationProvider } from '@modules/ai/providers/question-generation.provider';
import { ChunkService } from '@modules/chunks/chunk.service';
import { Chunk, ChunkSchema } from '@modules/chunks/schemas/chunk.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: Video.name, schema: VideoSchema},
            {name: Chunk.name, schema: ChunkSchema}
        ]),
        AiModule,
        forwardRef(() => QuestionModule)
    ],
    controllers: [VideoController],
    providers: [VideoService, TranscriptProvider, QuestionGenerationProvider, ChunkService],
    exports: [VideoService, QuestionGenerationProvider],
})
export class VideoModule {
}
