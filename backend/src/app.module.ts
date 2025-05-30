/**
 * Root module for the Guruji backend application
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoModule } from './modules/video/video.module';
import { QuestionModule } from './modules/question/question.module';
import { InteractionModule } from './modules/interaction/interaction.module';
import { AiModule } from './modules/ai/ai.module';
import { AnswersModule } from '@modules/answers/answer.module';
import { DoubtsModule } from '@modules/doubts/doubt.module';
import { VoiceModule } from '@modules/voice/voice.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://mongo-proxy-stage.penpencil.co:27015/guruji',
      }),
    }),

    // Application modules
    VideoModule,
    QuestionModule,
    InteractionModule,
    AiModule,
    AnswersModule,
    DoubtsModule,
    VoiceModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
