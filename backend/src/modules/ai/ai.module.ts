import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { OpenAiProvider } from './providers/openai.provider';
import { WhisperProvider } from './providers/whisper.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    OpenAiProvider,
    // ClaudeProvider,
    // GeminiProvider,
    WhisperProvider,
  ],
  exports: [AiService],
})
export class AiModule {}