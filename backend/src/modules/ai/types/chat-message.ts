// =============================
// src/modules/ai/types/chat-message.ts

import { AiModel } from "../enums/ai-model.enum";

// =============================
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiCallOptions {
  model?: AiModel;
  temperature?: number;
}