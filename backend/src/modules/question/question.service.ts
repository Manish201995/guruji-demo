/**
 * Service for handling question-related operations
 */

import { Injectable, Logger, NotFoundException, forwardRef, Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Question, QuestionDocument, QuestionType } from "./schemas/question.schema";
import { VideoService } from "../video/video.service";
import { ChunkService } from "@modules/chunks/chunk.service";
import { AiService } from "@modules/ai/ai.service";

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @Inject(forwardRef(() => VideoService)) private videoService: VideoService,
    private readonly chunks: ChunkService,
    private readonly ai: AiService
  ) {}

  /**
   * Create a new question
   */
  async createQuestion(questionData: Partial<Question>): Promise<Question> {
    try {
      const newQuestion = new this.questionModel(questionData);
      return await newQuestion.save();
    } catch (error) {
      this.logger.error(`Error creating question: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create multiple questions in batch
   */
  async createQuestions(questionsData: Partial<Question>[]): Promise<Question[]> {
    try {
      const result = await this.questionModel.insertMany(questionsData);
      return result as unknown as Question[];
    } catch (error) {
      this.logger.error(`Error creating questions in batch: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get questions for a specific video
   */
  async getQuestionsByVideoId(videoId: string): Promise<Question[]> {
    try {
      // Check if video exists and is processed
      const videoStatus = await this.videoService.checkVideoStatus(videoId);
      if (!videoStatus.exists) {
        throw new NotFoundException(`Video with ID ${videoId} not found`);
      }
      // if (!videoStatus.processed) {
      //   return []; // Return empty array if video is not processed yet
      // }

      // Get questions sorted by timestamp
      return this.questionModel.find({ videoId }).sort({ timestamp: 1 }).exec();
    } catch (error) {
      this.logger.error(`Error getting questions for video: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific question by ID
   */
  async getQuestionById(questionId: string): Promise<Question> {
    try {
      const question = await this.questionModel.findById(questionId).exec();
      if (!question) {
        throw new NotFoundException(`Question with ID ${questionId} not found`);
      }
      return question;
    } catch (error) {
      this.logger.error(`Error getting question by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate an answer to a question
   */
  async validateAnswer(
    questionId: string,
    answer: string
  ): Promise<{
    correct: boolean;
    feedback: string;
    hint?: string;
  }> {
    try {
      const question = await this.getQuestionById(questionId);

      // Determine if the answer is correct
      let isCorrect = false;

      if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
        // For multiple choice and true/false, compare directly
        isCorrect = answer === question.correctAnswer;
      } else if (question.type === QuestionType.FILL_BLANK) {
        // For fill in the blank, compare case-insensitive
        isCorrect = String(answer).toLowerCase() === String(question.correctAnswer).toLowerCase();
      } else if (question.type === QuestionType.SHORT_ANSWER) {
        // For short answer, more complex validation would be needed
        // This is a simplified version
        isCorrect = String(answer).toLowerCase().includes(String(question.correctAnswer).toLowerCase());
      }

      // Update question statistics
      await this.questionModel
        .findByIdAndUpdate(
          questionId,
          {
            $inc: {
              timesAnswered: 1,
              timesAnsweredCorrectly: isCorrect ? 1 : 0,
            },
          },
          { new: true }
        )
        .exec();

      // Return feedback based on correctness
      return {
        correct: isCorrect,
        feedback: isCorrect ? question.feedback.correct : question.feedback.incorrect,
        hint: !isCorrect ? question.hint : undefined,
      };
    } catch (error) {
      this.logger.error(`Error validating answer: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete all questions for a video (used when regenerating questions)
   */
  async deleteQuestionsByVideoId(videoId: string): Promise<void> {
    try {
      await this.questionModel.deleteMany({ videoId }).exec();
    } catch (error) {
      this.logger.error(`Error deleting questions for video: ${error.message}`, error.stack);
      throw error;
    }
  }

  getQuestionsByChunk(videoId: string, idx: number) {
    return this.questionModel.find({ videoId, chunkIdx: idx }).sort({ timestamp: 1 }).exec();
  }

  async generateChunkQuiz(videoId: string, idx: number) {
    const chunk = await this.chunks.findChunkByTime(videoId, idx);
    console.log("Generating questions for chunk", idx, chunk);
    if (!chunk) return [];

    const sys = "You are GuruJi. Produce ≤3 short questions in Hinglish, JSON only.";
    const usr = `Chunk #${idx} (${chunk.startSec}-${chunk.endSec}s): """${chunk.text}"""`;
    console.log("AI request for chunk questions:", sys, usr);

    const res = await this.ai.chatCompletion(
      [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      { temperature: 0.6 }
    );
    console.log("AI response for chunk questions:", res);
    return JSON.parse(res).questions;
  }
  private async llmForChunk(videoId: string, idx: number): Promise<any[]> {
    const chunk = await this.chunks.findChunkByTime(videoId, idx);
    if (!chunk) return [];

    // Prompt explicitly demands *only* raw JSON
    const sys = `
You are GuruJi. Produce up to 3 short quiz questions (MCQ or true/false) in Hinglish.
**IMPORTANT:** reply with a pure JSON array and **no** markdown or code fences.
Use this schema for each entry:
[
  {
    "text": "...",
    "type": "multiple_choice"|"true_false",
    "options": ["A","B","C","D"],
    "correctAnswer": 0,
    "hint": "..."
  }
]
`.trim();

    const usr = `Chunk #${idx} (${chunk.startSec}-${chunk.endSec}s): """${chunk.text}"""`;

    // call the model
    const raw = await this.ai.chatCompletion(
      [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      { temperature: 0.6 }
    );

    // strip any ``` fences if present
    const cleaned = ((): string => {
      const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      return fenceMatch ? fenceMatch[1].trim() : raw.trim();
    })();

    // parse JSON
    let arr: any[];
    try {
      arr = JSON.parse(cleaned);
    } catch (e) {
      this.logger.warn(`Chunk ${idx}: JSON parse failed →`, e.message, "\nRaw was:", cleaned);
      return [];
    }

    // validate shape
    return arr.filter(
      (q) =>
        typeof q.text === "string" &&
        typeof q.type === "string" &&
        Object.values(QuestionType).includes(q.type as QuestionType) &&
        (Array.isArray(q.options) || q.type === QuestionType.TRUE_FALSE) &&
        typeof q.correctAnswer !== "undefined"
    );
  }

  /**
   * Generate questions for *every* chunk, in sequence
   */
  async generateQuestionsFromChunks(videoId: string): Promise<Question[]> {
    // fetch all chunks
    const chunks = await this.chunks["chunkModel"].find({ videoId }).sort({ idx: 1 }).lean();

    if (!chunks.length) {
      throw new Error("No chunks found for video");
    }

    const allQs: Partial<Question>[] = [];

    for (const c of chunks) {
      const qs = await this.llmForChunk(videoId, c.idx);
      for (const q of qs) {
        allQs.push({
          videoId,
          chunkIdx: c.idx,
          text: q.text,
          type: q.type,
          options: Array.isArray(q.options) ? q.options : q.type === QuestionType.TRUE_FALSE ? ["True", "False"] : [],
          correctAnswer: String(q.correctAnswer),
          timestamp: c.startSec,
          feedback: { correct: "✅", incorrect: "❌" },
          hint: q.hint ?? "",
        });
      }
    }

    if (!allQs.length) {
      throw new Error("LLM returned no valid questions");
    }

    // wipe old and insert new
    // await this.deleteQuestionsByVideoId(videoId);
    return this.questionModel.insertMany(allQs) as unknown as Question[];
  }

  async generateAllChunksInOneShot(videoId: string) {
    const chunks = await this.chunks["chunkModel"].find({ videoId }).sort({ idx: 1 }).lean();
    if (!chunks.length) throw new Error("No chunks");

    const sys = "You are GuruJi. For each chunk emit ≤1 MCQ or TF. JSON array.";
    const usr = chunks.map((c) => `### chunk ${c.idx} (${c.startSec}-${c.endSec})\n${c.text}`).join("\n\n");

    const raw = await this.ai.chatCompletion(
      [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      { temperature: 0.4 }
    );
    const arr = JSON.parse(raw);

    await this.deleteQuestionsByVideoId(videoId);
    return this.questionModel.insertMany(
      arr.map((q: any) => ({
        videoId,
        ...q,
        correctAnswer: q.correctAnswer.toString(),
        feedback: { correct: "✅", incorrect: "❌" },
      }))
    );
  }

  async generateTimedQuestions(videoId: string): Promise<Question[]> {
    const video = await this.videoService.findByVideoId(videoId);
    const captions = video.transcriptArray ?? [];

    if (!captions.length) throw new Error("transcriptArray missing");

    /* 1️⃣  group captions into topics */
    const TOPIC_GAP = 90; // 1½ min of silence  → new topic
    const MAX_SPAN = 15 * 60; // 15 min hard limit

    const topics: { start: number; end: number; text: string }[] = [];
    let cur = { start: +captions[0].start, end: +captions[0].end, text: captions[0].text };

    for (let i = 1; i < captions.length; i++) {
      const c = captions[i];
      const gap = +c.start - cur.end;

      if (gap > TOPIC_GAP || +c.end - cur.start > MAX_SPAN) {
        topics.push(cur);
        cur = { start: +c.start, end: +c.end, text: c.text };
      } else {
        cur.end = +c.end;
        cur.text += " " + c.text;
      }
    }
    topics.push(cur);

    /* 2️⃣  hit the LLM once per topic */
    const out: Partial<Question>[] = [];
    for (const seg of topics) {
      const qArr = await this.askLLMForTopic(seg.text);
      qArr.forEach((q: any) =>
        out.push({
          videoId,
          chunkIdx: -1, // optional – not tied to old chunk grid
          text: q.text,
          type: q.type,
          options: q.options ?? (q.type === "true_false" ? ["True", "False"] : []),
          correctAnswer: String(q.correctAnswer),
          timestamp: Math.floor(seg.end), // 🔑 when to pop the quiz
          feedback: { correct: "✅", incorrect: "❌" },
          hint: q.hint ?? "",
        })
      );
    }

    if (!out.length) throw new Error("LLM returned no valid questions");

    await this.deleteQuestionsByVideoId(videoId);
    return this.questionModel.insertMany(out) as unknown as Question[];
  }

  /* ---- helper that enforces clean JSON ---- */
  private async askLLMForTopic(text: string): Promise<any[]> {
    const sys = `
    You are GuruJi. From the lecture extract below, create **one** quiz question
    (MCQ or True/False) in Hinglish that checks understanding of the *main concept*.
    Ignore jokes / greetings.  **Reply ONLY with a JSON array** like:
    [
      {
        "text": "…",
        "type": "multiple_choice",
        "options": ["A","B","C","D"],
        "correctAnswer": 1,
        "hint": "…"
      }
    ]`.trim();

    const raw = await this.ai.chatCompletion(
      [
        { role: "system", content: sys },
        { role: "user", content: text.slice(0, 4000) }, // safety truncation
      ],
      { temperature: 0.5 }
    );

    const clean = raw.replace(/```[\s\S]*?```/g, "").trim();
    try {
      return JSON.parse(clean);
    } catch (e) {
      this.logger.warn("✂️  bad JSON, skipping segment");
      return [];
    }
  }

  async generateQuestionsByTopics(videoId: string) {
    const video = await this.videoService.findByVideoId(videoId);
    if (!video.transcript) throw new Error("Transcript missing");

    // 1) split into ~topic sized blobs (~6-8 min each or gap>35s)
    const topics = this.segmentTranscript(video); // see helper↓
    console.log(topics);
    this.logger.debug(`⫸ ${videoId}: found ${topics.length} topics`);

    // 2) LLM for each topic — sequential to stay under rate-limit
    const all: Partial<Question>[] = [];
    for (const t of topics) {
      const qs = await this.llmMCQForTopic(t); // ▸ 5-6 MCQs
      qs.forEach((q: any, i: number) =>
        all.push({
          videoId,
          chunkIdx: t.idx, // coarse topic# as chunk
          text: q.text,
          type: QuestionType.MULTIPLE_CHOICE,
          options: q.options,
          correctAnswer: String(q.correctAnswer),
          timestamp: Math.round((+t.start + +t.end) / 2),
          feedback: { correct: "✅", incorrect: "❌" },
          hint: q.hint ?? "",
        })
      );
    }

    if (!all.length) throw new Error("LLM returned no questions");
    await this.deleteQuestionsByVideoId(videoId);
    return this.questionModel.insertMany(all) as unknown as Question[];
  }

  /* -------------------------------------------------- helpers */

  /** naive time-based segmentation – tweak to taste                           */
  private segmentTranscript(video: any) {
    const cap = video.transcriptArray; // still need times for TS !
    const GAP = 20; // ≥20-second pause  → new topic
    const MAX = 6 * 60; // force-split after ~6 min
    const groups: { idx: number; start: number; end: number; text: string }[] = [];

    let cur = { idx: 0, start: +cap[0].start, end: +cap[0].end, text: cap[0].text };
    for (let i = 1; i < cap.length; i++) {
      const c = cap[i];
      const gap = +c.start - +cur.end;
      if (gap > GAP || +c.end - cur.start > MAX) {
        groups.push(cur);
        cur = { idx: groups.length, start: +c.start, end: +c.end, text: c.text };
      } else {
        cur.end = +c.end;
        cur.text += " " + c.text;
      }
    }
    groups.push(cur);
    return groups;
  }

  private async llmMCQForTopic(chunk: { start: number; end: number; text: string }) {
    const sysPrompt = `
      You are GuruJi – an engaging Indian teacher.

      You will be given:
      • a transcript excerpt (Hindi/English mix) covering a single mini-topic
      • the excerpt’s **start** and **end** time (in seconds) in the original video.

      TASK
        1. Reflect: identify where the teacher *finishes explaining* the key idea(s)
          inside the excerpt.  Call that time *T_end* (it must lie between start and end).
        2. Right after *T_end* is the ideal moment to quiz the student.
        3. Write **5–6 multiple-choice questions** (simple Hinglish) that test the
          understanding of what was just taught.

      OUTPUT
      Return ONLY a JSON array (no markdown fences) where each element has:
        {
          "text"         : "<the question...?>"          (≤ 120 characters)
          "options"      : ["A","B","C","D"]             (4 concise options)
          "correctAnswer": <0-based index of correct>,
          "hint"         : "<≤12 words>",                (optional)
          "timestampSec" : <integer seconds >= start+30 and <= end>   // usually use T_end
        }

      IMPORTANT
      • Use everyday Hinglish wording.
      • All questions must refer **only** to the content in this excerpt.
      • The JSON MUST parse with no extra keys, no comments, no code fences.
      `.trim();

    const user = JSON.stringify({
      startSec: chunk.start,
      endSec: chunk.end,
      excerpt: chunk.text,
    });

    const raw = await this.ai.chatCompletion(
      [
        { role: "system", content: sysPrompt },
        { role: "user", content: user },
      ],
      { temperature: 0.4 }
    );

    const cleaned = raw.replace(/```[\s\S]*?```/g, "").trim();
    return JSON.parse(cleaned);
  }

  async generateQuestionsAuto(videoId: string): Promise<Question[]> {
    const video = await this.videoService.findByVideoId(videoId);
    if (!video.transcriptArray?.length) throw new Error("transcriptArray missing");

    /* ---------- 1️⃣  Call GPT with the whole caption list ---------------- */
    const sys = `
    You are GuruJi – an engaging Indian teacher and an expert instructional
    designer.

    INPUT (from the user) =
      {
        "durationSec":  <int>,
        "captions": [
          { "t": <startSec as number> , "txt": "<caption text>" },
          ...
        ]
      }

    TASK
      ▸ Read the whole lecture.
      ▸ Detect natural *topic boundaries* – whenever the teacher finishes
        explaining a coherent concept and is ready to move on.
      ▸ Immediately **after** each topic ends, design **5–6 MCQs** that test the
        just-finished concept (Hinglish, clear, concise).
      ▸ The Time to Ask the Questions should not disturb the student, we need to generate the questions so that the student does not lose focus.
      ▸ The questions should be simple and easy to understand, with clear options.
      ▸ The questions should be designed to test the understanding of the concept just taught.
      ▸ We Should ask the questions after minimum 15 minutes of starting of the video and at the end of the topic.
      The questions shouold not be random, it should be at same time of topi ends, like when topic ends, ask 5-6 questions.
      ▸ For every question decide **timestampSec** – pick a second that is
        *≥ topicEnd + 5 s* and *≤ nextTopicStart (or video end)*.

    OUTPUT
      Return **one flat JSON array** (no markdown!) – each element:
      {
        "text"         : "<question …?>"           // ≤ 120 chars, Hinglish
        "options"      : ["A","B","C","D"]          // 4 short options
        "correctAnswer": <0-based index>,
        "hint"         : "<≤12 words>",             // optional
        "timestampSec" : <integer>                  // as defined above
      }

    Rules
      • Only MCQ – no T/F.
      • All questions must be answerable **solely** from the lecture content that
        precedes their timestamp.
      • NO extra keys, NO comments, NO code fences.
    `.trim();

    // compress captions: keep start-time + text only
    const caps = video.transcriptArray.map((c: any) => ({
      t: Number(c.start),
      txt: c.text,
    }));

    const user = JSON.stringify({
      durationSec: video.duration ?? caps.at(-1)?.t ?? 0,
      captions: caps,
    });

    const raw = await this.ai.chatCompletion(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { temperature: 0.3 }
    );

    /* ---------- 2️⃣  Parse & validate ------------------------------------ */
    const json = raw.replace(/```[\s\S]*?```/g, "").trim();
    let arr: any[] = JSON.parse(json);
    arr = arr.filter(
      (q) =>
        typeof q.text === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correctAnswer) &&
        Number.isFinite(q.timestampSec)
    );
    if (!arr.length) throw new Error("GPT returned no usable questions");

    /* ---------- 3️⃣  Persist --------------------------------------------- */
    // await this.deleteQuestionsByVideoId(videoId);
    return this.questionModel.insertMany(
      arr.map((q) => ({
        videoId,
        chunkIdx: 0, // “0” – we no longer chunk
        text: q.text,
        type: QuestionType.MULTIPLE_CHOICE,
        options: q.options,
        correctAnswer: String(q.correctAnswer),
        timestamp: q.timestampSec,
        feedback: { correct: "✅", incorrect: "❌" },
        hint: q.hint ?? "",
      }))
    ) as unknown as Question[];
  }
}
