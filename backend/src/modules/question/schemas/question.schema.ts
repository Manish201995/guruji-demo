/**
 * Schema definition for Question documents in MongoDB
 */

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type QuestionDocument = Question & Document;

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  FILL_BLANK = "fill_blank",
  SHORT_ANSWER = "short_answer",
}
/**** …existing imports … ****/

@Schema({ timestamps: true })
export class Question {
  _id?: string;

  @Prop({ required: true, index: true })
  videoId: string;

  /* 🔥 NEW — each question remembers the chunk it belongs to */
  @Prop({ required: true, index: true })
  chunkIdx: number; // <-- added field

  @Prop({ required: true })
  text: string;

  @Prop({ required: true, enum: Object.values(QuestionType) })
  type: QuestionType;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ required: true })
  correctAnswer: string; // string by design

  @Prop({ required: true })
  timestamp: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  feedback: { correct: string; incorrect: string };

  @Prop() hint: string;

  @Prop({ default: 0 }) difficulty: number;
  @Prop({ default: 0 }) timesAnswered: number;
  @Prop({ default: 0 }) timesAnsweredCorrectly: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

/* keep the old compound index and gain one on chunkIdx if you want */
QuestionSchema.index({ videoId: 1, timestamp: 1 });
