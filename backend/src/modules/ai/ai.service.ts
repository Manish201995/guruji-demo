// src/modules/ai/ai.service.ts
/**
 * Generic AI gateway for GuruJi.
 * Swap or add models by registering a provider below.
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClaudeProvider } from "./providers/claude.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { OpenAiProvider } from "./providers/openai.provider";
import { WhisperProvider } from "./providers/whisper.provider";
import { AiModel } from "./enums/ai-model.enum";
import { BaseAiProvider } from "./interfaces/base-ai-provider.interface";
import { AiCallOptions, ChatMessage } from "./types/chat-message";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly providerMap = new Map<AiModel, BaseAiProvider>();
  private readonly defaultModel: AiModel;

  constructor(
    private readonly config: ConfigService,
    openai: OpenAiProvider,
    whisper: WhisperProvider
  ) {
    // Register providers
    this.providerMap
      .set(openai.model, openai)
      .set(whisper.model, whisper);

    this.defaultModel = (this.config.get<string>("AI_DEFAULT_MODEL") as AiModel) ?? AiModel.OPENAI;
  }

  /**
   * Unified chat completion
   */
  async chatCompletion(messages: ChatMessage[], options?: AiCallOptions): Promise<string> {
    const model = options?.model ?? this.defaultModel;
    const provider = this.providerMap.get(model);
    if (!provider) {
      throw new Error(`AI model "${model}" is not available`);
    }
    this.logger.debug(`Using provider: ${model}`);
    return provider.chatCompletion(messages, options);
  }

  /**
   * Audio transcription helper (delegates to Whisper)
   */
  async transcribeAudio(filePath: string): Promise<string> {
    const whisper = this.providerMap.get(AiModel.WHISPER) as WhisperProvider;
    if (!whisper) {
      throw new Error("Whisper provider not configured");
    }
    return whisper.transcribeAudio(filePath);
  }

  async embed(text: string): Promise<number[]> {
    const openai = this.providerMap.get(AiModel.OPENAI);
    if (!openai?.embed) throw new Error("Embedding provider not configured");
    return openai.embed(text);
  }
}
