// src/modules/ai/providers/whisper.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiModel } from '../enums/ai-model.enum';
import { BaseAiProvider } from '../interfaces/base-ai-provider.interface';

@Injectable()
export class WhisperProvider implements BaseAiProvider {
  readonly model = AiModel.WHISPER;
  private readonly logger = new Logger(WhisperProvider.name);
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey : this.config.get<string>('OPENAI_API_KEY'),
      baseURL: this.config.get<string>('OPENAI_BASE_URL'),
    });
  }

  // 🟡 Whisper is for speech → we leave chat unsupported
  async chatCompletion(messages: any[], options?: any): Promise<string> {
    throw new Error('Whisper provider does not support chat completion');
  }

  /** Transcribe audio → plain text */
  async transcribeAudio(filePath: string): Promise<string> {
    const fs = await import('fs');
    const response = await this.client.audio.transcriptions.create({
      /* your proxy whitelists “speech”, not “whisper-1” */
      model : this.config.get<string>('OPENAI_WHISPER_MODEL') ?? 'speech',
      file  : fs.createReadStream(filePath) as any,
    });
    return response.text;
  }
}
