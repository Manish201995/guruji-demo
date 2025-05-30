// src/modules/video/schemas/video.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type VideoDocument = Video & Document;

@Schema({ timestamps: true })
export class Video {
  /* ─────────── stored / indexed IDs ─────────── */
  _id?: string;

  @Prop({ required: true, unique: true, index: true })
  videoId: string; // "0peBVJuZXKE"

  /* ─────────── basic metadata ─────────── */
  @Prop() title?: string;
  @Prop() channelId?: string;
  @Prop() channelTitle?: string;

  /* NEW → full YouTube URL (handy for front-end) */
  @Prop() url?: string; // "https://www.youtube.com/…"

  /* ─────────── processing status ─────────── */
  @Prop({ default: false })
  processed: boolean;

  @Prop({ default: "pending" })
  processingStatus: "pending" | "processing" | "completed" | "failed";

  @Prop() processingError?: string;

  /* ─────────── transcripts ─────────── */
  /** plain text (no timestamps) – good for search / embeddings */
  @Prop() transcript?: string;

  /** raw JSON / string with timestamps, if you want to keep the original blob */
  @Prop() transcriptWithTimestamps?: string;

  /** handy array form: [{start:'0.05', end:'0.23', text:'…'}] */
  @Prop({
    type: [
      {
        start: { type: String, required: true },
        end: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    default: [],
  })
  transcriptArray: { start: string; end: string; text: string }[];

  /* ─────────── misc ─────────── */
  @Prop() duration?: number; // seconds
  @Prop({ default: Date.now }) lastProcessed: Date;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
