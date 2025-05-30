// src/modules/voice/voice.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { VoiceController } from './voice.controller';
import { AiModule } from '@modules/ai/ai.module';
import { AzureTtsProvider } from '@modules/ai/providers/azure-tts.provider';

@Module({
  imports: [
    AiModule,
    MulterModule.register({ dest: '/tmp' }),   // temp storage for uploads
  ],
  controllers: [VoiceController],
  providers: [AzureTtsProvider],
})
export class VoiceModule {}
