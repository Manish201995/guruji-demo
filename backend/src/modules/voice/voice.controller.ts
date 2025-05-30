// src/modules/voice/voice.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors, Header } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AiService } from "@modules/ai/ai.service";
import { AzureTtsProvider } from "@modules/ai/providers/azure-tts.provider";

@Controller("voice-chat")
export class VoiceController {
  constructor(
    private ai: AiService,
    private tts: AzureTtsProvider
  ) {}

  @Post()
  @Post()
  @UseInterceptors(FileInterceptor("audio"))
  async chat(@UploadedFile() file: Express.Multer.File) {
    const text = await this.ai.transcribeAudio(file.path); // Whisper
    const reply = await this.ai.chatCompletion([
      { role: "system", content: "Voice mode ON. Speak like teacher, Hinglish, ≤120 chars." },
      { role: "user", content: text },
    ]);

    return this.tts.speak(reply); // returns mp3 Buffer
  }
}
