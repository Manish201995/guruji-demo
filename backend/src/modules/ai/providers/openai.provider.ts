// =============================
// src/modules/ai/providers/openai.provider.ts
// =============================
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { BaseAiProvider } from "../interfaces/base-ai-provider.interface";
import { ChatMessage, AiCallOptions } from "../types/chat-message";
import { AiModel } from "../enums/ai-model.enum";

@Injectable()
export class OpenAiProvider implements BaseAiProvider {
  readonly model = AiModel.OPENAI;
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>("OPENAI_API_KEY");
    const base = this.config.get<string>("OPENAI_BASE_URL");
    this.client = new OpenAI({
      apiKey: key,
      baseURL: base || undefined, // falls back to api.openai.com if empty
    });
  }

  async chatCompletion(messages: ChatMessage[], options?: AiCallOptions): Promise<string> {
    try {
      const modelName = this.config.get<string>("OPENAI_CHAT_MODEL") ?? "gpt4o";
      console.log(`Using OpenAI model: ${modelName}`);
      const response = await this.client.chat.completions.create({
        model: modelName,
        messages,
        temperature: options?.temperature ?? 0.7,
      });
      console.log("OpenAI response:", response);
      const content = response.choices[0].message.content;
      if (content === null) {
        throw new Error("OpenAI response content is null");
      }
      return content;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async embed(text: string): Promise<number[]> {
    const resp = await this.client.embeddings.create({
      model: this.config.get<string>("OPENAI_EMBED_MODEL") ?? "text-embedding-3-small",
      input: text,
    });
    return resp.data[0].embedding;
  }
}
