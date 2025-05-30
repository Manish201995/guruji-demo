// src/modules/question/ask.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { AiService } from "@modules/ai/ai.service";
import { ChunkService } from "@modules/chunks/chunk.service";
import { VideoService } from "@modules/video/video.service";

@Controller("ask")
export class AskController {
  constructor(
    private ai: AiService,
    private chunks: ChunkService,
    private videoService: VideoService
  ) {}

  @Post()
  async ask(@Body() dto: { videoId: string; question: string }) {
    const qVec = await this.ai.embed(dto.question); // add tiny helper in AiService
    // const top = await this.chunks.similaritySearch(dto.videoId, qVec, 4);
    // const context = top.map((t) => t.text).join("\n");
    const context = await this.videoService.findByVideoId(dto.videoId).then((video) => video.transcript);
    const answer = await this.ai.chatCompletion([
      {
        role: "system",
        content: `You are GuruJi, a warm, caring teacher.
        • Tone - sound like a helpful human; no emojis.  
        • Length - answer in ONE paragraph, 3-4 short lines max. 
        • Language     - if the learner's question is mostly English, answer in simple English; otherwise answer in easy Hinglish and Use only English Text. 
        • Simplicity    - explain using only CBSE class 11-12 ideas; avoid complex terms and outside resources.  
        • Style         - break tough ideas into plain words; stay polite; ignore minor typos.  
        • Clarification - ask for clarification only when the question itself is unclear.  
        • Unknowns      - if the answer is not present in the provided context, reply exactly:  
            “Pls Ask the relevant question related to the video.” (no extras) 
        You will receive:
          CONTEXT : a transcript excerpt from a YouTube lecture  
          QUESTION: what the learner asked

        Use ONLY the CONTEXT to craft your reply.`,
      },
      { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION:\n${dto.question}` },
    ]);

    return { answer };
  }
}
