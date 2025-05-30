// =============================
// src/modules/ai/providers/gemini.provider.ts
// =============================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAiProvider } from '../interfaces/base-ai-provider.interface';
import { ChatMessage, AiCallOptions } from '../types/chat-message';
import { AiModel } from '../enums/ai-model.enum';

@Injectable()
export class GeminiProvider implements BaseAiProvider {
  readonly model = AiModel.GEMINI;
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async chatCompletion(messages: ChatMessage[], options?: AiCallOptions): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: this.config.get<string>('GEMINI_CHAT_MODEL') ?? 'gemini-1.5-pro-latest' });
      const contents = messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      const result = await model.generateContent({ contents });
      return result.response.text();
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}