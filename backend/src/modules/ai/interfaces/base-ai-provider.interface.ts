// =============================
// src/modules/ai/interfaces/base-ai-provider.interface.ts
// =============================
import { ChatMessage, AiCallOptions } from "../types/chat-message";
import { AiModel } from "../enums/ai-model.enum";

export interface BaseAiProvider {
  /** The model this provider supports */
  readonly model: AiModel;

  /** Chat completion entry point */
  chatCompletion(messages: ChatMessage[], options?: AiCallOptions): Promise<string>;

  /** Optional — only OpenAI provider implements it for now */
  embed?(text: string): Promise<number[]>;
}
