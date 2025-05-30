// =============================
// src/modules/ai/providers/claude.provider.ts
// =============================
import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiModel } from '../enums/ai-model.enum';
import { BaseAiProvider } from '../interfaces/base-ai-provider.interface';
import { AiCallOptions, ChatMessage } from '../types/chat-message';

@Injectable()
export class ClaudeProvider implements BaseAiProvider {
  readonly model = AiModel.CLAUDE;
  private readonly logger = new Logger(ClaudeProvider.name);
  private readonly client: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({ apiKey: this.config.get<string>('ANTHROPIC_API_KEY') });
  }

  private toAnthropic(messages: ChatMessage[]) {
    // Anthropic format: alternating user/assistant content blobs
    return messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content }));
  }

  async chatCompletion(messages: ChatMessage[], options?: AiCallOptions): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.config.get<string>('CLAUDE_CHAT_MODEL') ?? 'claude-3-opus-20240229',
        max_tokens: 1024,
        temperature: options?.temperature ?? 0.7,
        messages: this.toAnthropic(messages),
      });
      const firstBlock = response.content?.[0];
      if (firstBlock && firstBlock.type === 'text') {
        return firstBlock.text;
      }
      return '';
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}
